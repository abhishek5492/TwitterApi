using System.Collections.Generic;
using Tweetinvi;
using System.Configuration;
using Tweetinvi.Models;
using System.Web.Http;
using Google.Cloud.Language.V1;
using Console = System.Console;
using TwitterCore;

namespace Streaming_Tweets_Dashboard.Controllers
{
    
    public class ValuesController : ApiController
    {
        
        [HttpGet]
        public List<string> GetTweet(string searchInput)
        {
            Twitter tw = new Twitter(ConfigurationManager.AppSettings["ConsumerKey"], ConfigurationManager.AppSettings["ConsumerSecret"], ConfigurationManager.AppSettings["AccessToken"], ConfigurationManager.AppSettings["AccessTokenSecret"]); 

            return tw.GetTweets(searchInput);
            
        }

        [HttpGet]
        //sentiment analysis for a given tweet
        public List<float> analyzeTweet(string tweet)
        {
            List<float> scoreMagnitude = new List<float>();          
            var client = LanguageServiceClient.Create(); //create a client for google natural language
            var response = client.AnalyzeSentiment(Document.FromPlainText(tweet)); // calling the Google natural language API 
            var sentiment = response.DocumentSentiment;
            scoreMagnitude.Add(sentiment.Score);
            scoreMagnitude.Add(sentiment.Magnitude);
            return scoreMagnitude;
        }

        
    }
    
}
