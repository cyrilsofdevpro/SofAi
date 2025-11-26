import React, {useState, useEffect, useRef} from 'react';
import {sendMessage, getHistory, getApiBase} from './api';

export default function Chat(){
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(()=>{
    let mounted = true
    getHistory().then(data=>{
      if(!mounted) return
      if(data && data.messages) setMessages(data.messages)
    }).catch(()=>{})
    return ()=>{ mounted = false }
  }, [])

  useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const onSend = async () =>{
    if(!text) return
    const userMsg = {role:'user', text}
    setMessages(m=>[...m, userMsg])
    setText('')
    setLoading(true)
    try{
      const res = await sendMessage(text)
      const botText = res?.reply ?? '[no reply]'
      setMessages(m=>[...m, {role:'bot', text:botText}])
    }catch(e){
      setMessages(m=>[...m, {role:'bot', text:'Error: '+(e.message || e)}])
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <div ref={scrollRef} style={{height:360, overflow:'auto', border:'1px solid #eee', padding:8, marginBottom:8}}>
        {messages.map((m, i)=>(
          <div key={i} style={{margin:6, textAlign: m.role==='user'? 'right':'left'}}>
            <div style={{display:'inline-block', background: m.role==='user'? '#007bff':'#f1f1f1', color: m.role==='user'? '#fff':'#000', padding:8, borderRadius:6}}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} style={{flex:1, padding:8}} placeholder='Type a message' onKeyDown={e=>{ if(e.key==='Enter') onSend() }} />
        <button onClick={onSend} disabled={loading} style={{padding:'8px 12px'}}>{loading? '...' : 'Send'}</button>
      </div>
      <div style={{marginTop:8, fontSize:12, color:'#666'}}>
        API: {getApiBase()}
      </div>
    </div>
  )
}
