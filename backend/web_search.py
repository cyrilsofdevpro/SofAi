"""
Web Search Integration for SofAi
Uses DuckDuckGo (free) or SerpAPI (better results)
"""

import requests
from typing import List, Dict, Optional
import os

class WebSearchService:
    """Handles web search queries using multiple backends"""
    
    def __init__(self, api_provider: str = "duckduckgo"):
        self.api_provider = api_provider.lower()
        self.serpapi_key = os.getenv("SERPAPI_KEY", "")
        self.timeout = 10
    
    def search(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """
        Perform web search and return results
        
        Args:
            query: Search query string
            num_results: Number of results to return
            
        Returns:
            List of search results with title, snippet, and link
        """
        try:
            if self.api_provider == "serpapi" and self.serpapi_key:
                return self._search_serpapi(query, num_results)
            else:
                return self._search_duckduckgo(query, num_results)
        except Exception as e:
            print(f"Web search error: {e}")
            return []
    
    def _search_serpapi(self, query: str, num_results: int) -> List[Dict[str, str]]:
        """
        Search using SerpAPI (Google results)
        Requires SERPAPI_KEY environment variable
        """
        url = "https://serpapi.com/search.json"
        
        params = {
            "q": query,
            "api_key": self.serpapi_key,
            "num": num_results
        }
        
        response = requests.get(url, params=params, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()
        
        results = []
        
        for item in data.get("organic_results", [])[:num_results]:
            results.append({
                "title": item.get("title", ""),
                "snippet": item.get("snippet", ""),
                "link": item.get("link", ""),
                "source": "SerpAPI"
            })
        
        return results
    
    def _search_duckduckgo(self, query: str, num_results: int) -> List[Dict[str, str]]:
        """
        Search using DuckDuckGo (free, no API key needed)
        """
        # Using unofficial DuckDuckGo API endpoint
        url = "https://html.duckduckgo.com/"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        params = {
            "q": query,
            "t": "sofai"
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            
            # Parse results from HTML (simplified parsing)
            results = self._parse_duckduckgo_results(response.text)
            return results[:num_results]
            
        except Exception as e:
            print(f"DuckDuckGo search failed: {e}")
            return self._get_fallback_results(query)
    
    def _parse_duckduckgo_results(self, html: str) -> List[Dict[str, str]]:
        """
        Parse DuckDuckGo HTML results
        This is a simplified parser - a real implementation would use BeautifulSoup
        """
        # For now, return empty list - implement proper HTML parsing with BeautifulSoup
        # or use the official API wrapper
        return []
    
    def _get_fallback_results(self, query: str) -> List[Dict[str, str]]:
        """
        Return basic fallback results when API fails
        """
        return [
            {
                "title": "Search Results",
                "snippet": f"Unable to fetch live results for '{query}'. Please try again.",
                "link": "https://google.com/search?q=" + query.replace(" ", "+"),
                "source": "Fallback"
            }
        ]


# Global search service instance
search_service = None


def initialize_search_service(provider: str = "duckduckgo") -> WebSearchService:
    """Initialize the web search service"""
    global search_service
    search_service = WebSearchService(api_provider=provider)
    return search_service


def perform_search(query: str, num_results: int = 5) -> List[Dict[str, str]]:
    """
    Perform a web search
    
    Args:
        query: Search query
        num_results: Number of results to return
        
    Returns:
        List of search results
    """
    global search_service
    if search_service is None:
        search_service = initialize_search_service()
    
    return search_service.search(query, num_results)


def needs_search(query: str) -> bool:
    """
    Determine if a query requires web search
    Returns True if query contains keywords indicating need for real-time information
    """
    search_keywords = [
        "latest", "news", "current", "today", "price", "stock",
        "weather", "who is", "what is", "how much", "when is",
        "trending", "new", "update", "breaking", "recent"
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in search_keywords)


def format_search_context(results: List[Dict[str, str]]) -> str:
    """
    Format search results into a context string for the AI model
    """
    if not results:
        return ""
    
    context = "Here is real-time web information:\n\n"
    
    for i, result in enumerate(results, 1):
        context += f"[Source {i}] {result.get('title', 'No title')}\n"
        snippet = result.get('snippet', 'No snippet available')
        # Truncate long snippets
        if len(snippet) > 200:
            snippet = snippet[:200] + "..."
        context += f"{snippet}\n"
        context += f"Link: {result.get('link', 'No link')}\n\n"
    
    return context


def build_search_prompt(user_message: str, search_results: List[Dict[str, str]]) -> str:
    """
    Build a prompt that includes web search results for the AI
    """
    context = format_search_context(search_results)
    
    prompt = f"""User question: {user_message}

{context}

Instructions:
1. Use the provided web information to answer accurately
2. Mention the sources when relevant
3. Be clear and concise
4. If information is outdated or irrelevant, let the user know"""
    
    return prompt
