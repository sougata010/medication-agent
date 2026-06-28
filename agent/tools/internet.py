import os
from dotenv import load_dotenv
from tavily import TavilyClient
from schema.internet import Internet
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#loading the tavily api key
load_dotenv()
tavily_api_key = os.getenv("TAVILY_API_KEY")
if not tavily_api_key:
    raise RuntimeError("Tavily API Key not loaded")

class TavilySearcher:
    def __init__(self)->None:
        self.key = tavily_api_key
        self.results = []
        self.tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        self.config = {
            "search_depth":"basic",
            "include_answer":True,
            "max_results":3,
            "topic":"general"
        }
    def set_config(self,search_depth:str,include_answer:bool,max_results:int,topic:str)->None:
        self.config["search_depth"]=search_depth
        self.config["include_answer"]=include_answer
        self.config["max_results"]=max_results
        self.config["topic"]=topic
    def search_query(self,search_item:str)->Internet:
        try:
            response = self.tavily.search(search_item,**self.config)
            answer = response.get("answer", "No direct answer summary generated.")
            search_res = response.get("results") or []
            search_res_list = []
            for search in search_res:
                item = {
                    "title": search.get("title", "No Title"),
                    "url": search.get("url", ""),
                    "content": search.get("content", "No Content available.")
                }
                search_res_list.append(item)
            self.results.append(search_res_list)
            return Internet(answer=answer,search_res=search_res_list)
        except Exception as e:
            logger.error(f"Tavily search failed for query '{search_item}': {str(e)}")
            fallback_answer = f"Sorry, I couldn't fetch live data right now due to a connection error: {str(e)}"
            return Internet(answer=fallback_answer, results=[])

