import os
from typing import Optional, Dict, Any

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
except Exception:  # pragma: no cover - allow import-time availability to be optional
    AutoTokenizer = AutoModelForCausalLM = torch = None


class ModelWrapper:
    """Robust HF model loader and simple generator helper.

    Features:
    - cached model instances
    - automatic device selection (CUDA if available)
    - optional 8-bit / bfloat16 hints when supported
    - safer tokenizer handling
    """

    MODEL_CACHE: Dict[str, "ModelWrapper"] = {}

    def __init__(self, tokenizer, model, device: str = "cpu"):
        self.tokenizer = tokenizer
        self.model = model
        self.device = device

    @classmethod
    def load_cached(cls, model_name: str = "mistral-7b-instruct", trust_remote_code: bool = False, load_in_8bit: bool = False, revision: Optional[str] = None) -> "ModelWrapper":
        key = f"{model_name}:{'8bit' if load_in_8bit else 'fp'}:{revision or 'main'}"
        if key in cls.MODEL_CACHE:
            return cls.MODEL_CACHE[key]
        wrapper = cls._load_model(model_name, trust_remote_code=trust_remote_code, load_in_8bit=load_in_8bit, revision=revision)
        cls.MODEL_CACHE[key] = wrapper
        return wrapper

    @classmethod
    def _load_model(cls, model_name: str, trust_remote_code: bool = False, load_in_8bit: bool = False, revision: Optional[str] = None) -> "ModelWrapper":
        if AutoTokenizer is None:
            raise ImportError("transformers and torch are required to load models. Install via pip: pip install transformers torch accelerate")

        # choose device
        has_cuda = torch.cuda.is_available() if torch is not None else False
        device = "cuda" if has_cuda else "cpu"

        # tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=trust_remote_code, revision=revision, use_fast=True)
        # ensure pad token exists
        if tokenizer.pad_token is None:
            if tokenizer.eos_token is not None:
                tokenizer.pad_token = tokenizer.eos_token
            else:
                tokenizer.add_special_tokens({"pad_token": "<pad>"})

        # model loading kwargs
        load_kwargs: Dict[str, Any] = {"trust_remote_code": trust_remote_code}
        if device == "cuda":
            # prefer automatic device map when CUDA is available
            load_kwargs.update({"device_map": "auto"})
            # allow 8-bit if requested and bitsandbytes is available
            if load_in_8bit:
                load_kwargs.update({"load_in_8bit": True})
        else:
            # CPU-friendly flags
            load_kwargs.update({"low_cpu_mem_usage": True})

        model = AutoModelForCausalLM.from_pretrained(model_name, revision=revision, **load_kwargs)

        # move to cpu if needed (from_pretrained may have placed it already)
        if device == "cpu":
            try:
                model.to("cpu")
            except Exception:
                pass

        return cls(tokenizer=tokenizer, model=model, device=device)

    def generate_response(self, prompt: str, max_new_tokens: int = 100, do_sample: bool = True, temperature: float = 0.6, top_p: float = 0.85, stop_tokens: Optional[list] = None, **gen_kwargs) -> str:
        """Generate a response string for a given prompt with improved quality settings.

        This method keeps the implementation simple but avoids returning the prompt
        concatenated with the model output by removing the input prompt from the
        decoded text when possible.
        
        Tuned defaults for instruction-tuned models (Qwen, etc):
        - max_new_tokens=100: Shorter, focused answers (avoid rambling)
        - temperature=0.6: More deterministic, focused responses
        - top_p=0.85: Tighter nucleus sampling for coherence without loss of diversity
        """
        if self.tokenizer is None or self.model is None:
            raise RuntimeError("ModelWrapper is not properly initialized")

        inputs = self.tokenizer(prompt, return_tensors="pt")
        input_ids = inputs.get("input_ids")
        if self.device == "cuda":
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        generate_params = dict(
            input_ids=inputs.get("input_ids"),
            attention_mask=inputs.get("attention_mask"),
            max_new_tokens=max_new_tokens,
            do_sample=do_sample,
            temperature=temperature,
            top_p=top_p,
            pad_token_id=self.tokenizer.eos_token_id,
        )
        generate_params.update(gen_kwargs)

        outputs = self.model.generate(**generate_params)

        # outputs may include the prompt tokens; decode only the newly generated tokens
        try:
            # When possible, slice off the prompt length
            if isinstance(outputs, torch.Tensor):
                generated_ids = outputs[0][input_ids.shape[-1]:]
            else:
                generated_ids = outputs[0]
            text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)
        except Exception:
            # fallback: decode full sequence and remove prompt text if present
            text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            if text.startswith(prompt):
                text = text[len(prompt):]

        # apply simple stop token trimming
        if stop_tokens:
            for t in stop_tokens:
                idx = text.find(t)
                if idx != -1:
                    text = text[:idx]
                    break

        return text.strip()
