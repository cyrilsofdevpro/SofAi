# Web Search Integration Guide

SofAi now includes web search capabilities that allow the AI to provide real-time information from the internet. This guide covers setup, usage, and customization.

## Overview

The web search feature enables SofAi to:
- Fetch real-time information from the web
- Answer questions about current events, news, and trending topics
- Provide sources and links for research
- Detect when searches are necessary vs. using local knowledge

## Features

### Automatic Search Detection
The system automatically detects queries that require web search based on keywords:
- **Temporal keywords**: "latest", "today", "current", "new", "breaking", "recent"
- **Information keywords**: "news", "trending", "update"
- **Query keywords**: "who is", "what is", "how much", "when is", "price", "weather", "stock"

### Multiple Search Backends

#### DuckDuckGo (Free, No API Key)
- **Pros**: Free, no registration, no rate limits
- **Cons**: Less reliable parsing, less detailed results
- **Implementation**: `web_search.py` includes DuckDuckGo support
- **Default**: Currently selected for basic functionality

#### SerpAPI (Google Results, Requires API Key)
- **Pros**: Better results, reliable, official Google API
- **Cons**: Requires API key, has usage limits (100 free searches/month)
- **Setup**: 
  ```bash
  # Get API key from https://serpapi.com
  # Set environment variable
  export SERPAPI_KEY="your_api_key_here"
  ```
- **Cost**: 100 free searches/month, then $5-50/month depending on usage
- **Recommended**: For production use

### Search Results Format

All search backends return results in this format:

```json
[
  {
    "title": "Result Title",
    "snippet": "Brief summary of the content...",
    "link": "https://example.com/page",
    "source": "SerpAPI" or "DuckDuckGo"
  }
]
```

## Setup Instructions

### Basic Setup (DuckDuckGo - No Configuration Needed)

The DuckDuckGo backend is already integrated and requires no configuration:

```python
# Already configured in web_search.py
search_service = WebSearchService(api_provider="duckduckgo")
```

### Advanced Setup (SerpAPI - Recommended for Production)

1. **Get API Key**:
   - Visit https://serpapi.com
   - Sign up for free account
   - Copy your API key from dashboard

2. **Configure Environment Variable**:
   
   **Windows (PowerShell)**:
   ```powershell
   $env:SERPAPI_KEY = "your_api_key_here"
   ```
   
   **Windows (Command Prompt)**:
   ```cmd
   set SERPAPI_KEY=your_api_key_here
   ```
   
   **Linux/Mac**:
   ```bash
   export SERPAPI_KEY="your_api_key_here"
   ```

3. **Update backend/main.py**:
   ```python
   # Change the initialization
   search_service = initialize_search_service(provider="serpapi")
   ```

4. **Update backend/web_search.py** (if using different provider):
   ```python
   def initialize_search_service(provider: str = "serpapi"):
       global search_service
       search_service = WebSearchService(api_provider=provider)
       return search_service
   ```

## Integration Points

### Python FastAPI Backend (backend/main.py)

The `/chat` and `/predict` endpoints automatically use web search:

```python
# Automatic search detection
if needs_search(req.message):
    search_results = perform_search(req.message, num_results=5)
    used_search = len(search_results) > 0

# Results included in response
return ChatResponse(
    reply=reply, 
    sources=search_results if used_search else None, 
    used_search=used_search
)
```

### Node.js Express Backend (backend/server.js)

Web search is also integrated into the Node.js backend:

```javascript
// Automatic search detection
if (needsSearch(message)) {
    searchResults = performWebSearch(message, 5);
    usedSearch = searchResults.length > 0;
}

// Results included in response
res.json({
    reply: reply,
    sources: usedSearch ? searchResults : null,
    used_search: usedSearch
});
```

### Frontend Integration

The frontend can consume search results:

```javascript
// API call returns:
{
    reply: "AI response text...",
    sources: [
        { title: "...", snippet: "...", link: "..." },
        { title: "...", snippet: "...", link: "..." }
    ],
    used_search: true
}

// Display sources to user
if (response.sources) {
    sources.forEach((source, i) => {
        console.log(`[${i+1}] ${source.title}`);
        console.log(`    ${source.snippet}`);
        console.log(`    ${source.link}`);
    });
}
```

## Usage Examples

### Example 1: News Query

**User Query**: "What are the latest news about AI?"

**Process**:
1. Query detected as news-related (keyword: "latest", "news")
2. Web search performed for "What are the latest news about AI?"
3. Top 5 results fetched from web
4. Results included in system prompt to AI
5. AI generates response incorporating search results
6. Sources returned to user

**Response**:
```json
{
    "reply": "Based on recent web results, several major AI developments are happening...",
    "sources": [
        {
            "title": "OpenAI Releases GPT-4 Turbo",
            "snippet": "OpenAI has announced GPT-4 Turbo with improved capabilities...",
            "link": "https://example.com/gpt4-turbo"
        },
        // ... more results
    ],
    "used_search": true
}
```

### Example 2: Local Knowledge Query

**User Query**: "How does photosynthesis work?"

**Process**:
1. Query detected as NOT requiring search (no temporal/trending keywords)
2. No web search performed
3. AI responds from local knowledge
4. Sources field is null

**Response**:
```json
{
    "reply": "Photosynthesis is a process used by plants...",
    "sources": null,
    "used_search": false
}
```

### Example 3: Price Query

**User Query**: "What is the current price of Bitcoin?"

**Process**:
1. Query detected as needing search (keyword: "current", "price")
2. Web search performed for Bitcoin price
3. Latest prices fetched
4. AI formats response with current data
5. Sources provided for verification

## Configuration

### Customize Search Keywords

Edit `backend/web_search.py`:

```python
def needs_search(query: str) -> bool:
    """Customize search keywords"""
    search_keywords = [
        # Add or remove keywords as needed
        "latest", "news", "current", "today", "price", "stock",
        "weather", "sports scores", "celebrity news"
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in search_keywords)
```

### Customize Result Count

Default is 5 results. Change in endpoints:

```python
# Python backend
search_results = perform_search(req.message, num_results=10)

# Node.js backend
searchResults = performWebSearch(message, 10);
```

### Customize Search Context in Prompt

Edit `backend/web_search.py`:

```python
def format_search_context(results: List[Dict[str, str]]) -> str:
    """Customize how search results are formatted for the AI"""
    context = "Here is real-time web information:\n\n"
    
    for i, result in enumerate(results, 1):
        context += f"[Source {i}] {result.get('title', 'No title')}\n"
        # ... customize formatting here
    
    return context
```

## Performance Considerations

### Search Latency
- DuckDuckGo: 1-3 seconds (slower, free)
- SerpAPI: 0.5-2 seconds (faster, paid)

### API Rate Limits
- DuckDuckGo: No official limits (may block aggressive scrapers)
- SerpAPI: 100/month free, then depends on plan

### Optimization Tips

1. **Cache Frequently Asked Questions**:
   ```python
   search_cache = {}
   
   def cached_search(query):
       if query in search_cache:
           return search_cache[query]
       results = perform_search(query)
       search_cache[query] = results
       return results
   ```

2. **Limit Search Results**:
   ```python
   # Use fewer results to reduce latency
   search_results = perform_search(req.message, num_results=3)
   ```

3. **Timeout Searches**:
   ```python
   # In WebSearchService
   self.timeout = 5  # seconds
   ```

## Troubleshooting

### Issue: Web search not working

**Solution 1**: Check API key
```python
import os
print(os.getenv("SERPAPI_KEY"))  # Should print your key
```

**Solution 2**: Check internet connection
```python
import requests
response = requests.get("https://google.com")
print(response.status_code)  # Should be 200
```

**Solution 3**: Check error logs
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Issue: Slow responses

**Solution**: Use faster backend
```python
# Switch from DuckDuckGo to SerpAPI
search_service = WebSearchService(api_provider="serpapi")
```

### Issue: Getting duplicate or irrelevant results

**Solution**: Refine search query keywords
```python
def needs_search(query: str) -> bool:
    # Make keywords more specific
    search_keywords = [
        "latest news", "breaking news",  # More specific
        "current price", "live price"     # More specific
    ]
```

## Advanced Features

### Custom Search Function

Replace the default search with your own:

```python
def custom_search(query: str, num_results: int = 5):
    """Your custom search implementation"""
    # Implement your own search logic
    # Can use Bing, DuckDuckGo, or another provider
    results = []
    # ... fetch and process results
    return results

# Use in endpoint
search_results = custom_search(req.message)
```

### Search Result Filtering

Filter out low-quality results:

```python
def filter_search_results(results, quality_threshold=0.5):
    """Filter results by quality score"""
    filtered = []
    for result in results:
        if len(result['snippet']) > 100:  # Minimum snippet length
            filtered.append(result)
    return filtered[:5]  # Return top 5
```

### Multi-Source Search

Combine results from multiple sources:

```python
def multi_source_search(query: str):
    """Search multiple sources and combine results"""
    duckduckgo_results = search_service_ddg.search(query)
    google_results = search_service_serpapi.search(query)
    
    # Combine and deduplicate
    all_results = duckduckgo_results + google_results
    unique_results = {r['link']: r for r in all_results}.values()
    
    return list(unique_results)[:5]
```

## Security & Privacy

### API Key Management

**Never commit API keys**:
```python
# ❌ Don't do this
SERPAPI_KEY = "se-1234567890abcdef"  # Visible in code

# ✅ Do this instead
import os
SERPAPI_KEY = os.getenv("SERPAPI_KEY")  # Load from environment
```

### Rate Limiting

Implement rate limiting for search requests:

```python
from datetime import datetime, timedelta

search_timestamps = {}

def rate_limited_search(user_id: str, query: str):
    """Limit searches per user"""
    now = datetime.now()
    
    if user_id in search_timestamps:
        last_search = search_timestamps[user_id]
        if (now - last_search).seconds < 5:  # Min 5 seconds between searches
            return None  # Too fast, skip search
    
    search_timestamps[user_id] = now
    return perform_search(query)
```

## Future Enhancements

### Planned Features

1. **Search Result Caching**: Cache common queries to reduce API calls
2. **Image Search**: Include images in search results
3. **Real-time Stock Quotes**: Direct integration with stock APIs
4. **Weather Integration**: Direct weather API integration
5. **Wikipedia Integration**: Prioritize Wikipedia for factual questions
6. **News Aggregation**: Combine results from news sources
7. **Search Analytics**: Track what's being searched
8. **User Feedback**: Learn from user feedback on search quality

## API Reference

### `perform_search(query: str, num_results: int = 5) -> List[Dict[str, str]]`

Perform a web search.

**Parameters**:
- `query` (str): Search query
- `num_results` (int): Number of results to return (default: 5)

**Returns**: List of search results

**Example**:
```python
results = perform_search("Python programming tips", num_results=10)
for result in results:
    print(f"{result['title']} - {result['link']}")
```

### `needs_search(query: str) -> bool`

Determine if a query needs web search.

**Parameters**:
- `query` (str): User query

**Returns**: True if search is needed, False otherwise

**Example**:
```python
if needs_search("What's trending today?"):
    results = perform_search("trending today")
```

### `format_search_context(results: List[Dict[str, str]]) -> str`

Format search results into a context string.

**Parameters**:
- `results` (List[Dict]): Search results

**Returns**: Formatted string for AI context

**Example**:
```python
context = format_search_context(search_results)
prompt = f"Use this information: {context}\n\nAnswer: "
```

## Support & Feedback

For issues or feature requests related to web search:
- Check the troubleshooting section above
- Review error logs in console output
- File an issue in the GitHub repository
- Contact the development team

## Resources

- [SerpAPI Documentation](https://serpapi.com/docs)
- [DuckDuckGo API](https://duckduckgo.com/api)
- [Web Search Best Practices](https://google.com/search?q=web+search+best+practices)
- [API Rate Limiting](https://en.wikipedia.org/wiki/Rate_limiting)
