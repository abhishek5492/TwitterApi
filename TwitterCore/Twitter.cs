using System;
using System.Collections.Generic;
using Tweetinvi;
using System.Configuration;
using Tweetinvi.Models;



namespace TwitterCore
{
    public class Twitter:ITwitter
    {
        public string ConsumerKey;
        public string ConsumerSecret;
        public string AccessToken;
        public string AccessTokenSecret;
        public  Twitter(string ConsumerKey, string ConsumerSecret, string AccessToken,  string AccessTokenSecret) {
            this.ConsumerKey = ConsumerKey;
            this.ConsumerSecret = ConsumerSecret;
            this.AccessToken = AccessToken;
            this.AccessTokenSecret = AccessTokenSecret;
        }
        public List<string> GetTweets(string searchInput)
        {
            Auth.SetUserCredentials(ConsumerKey, ConsumerSecret, AccessToken, AccessTokenSecret);
            List<string> tweets = new List<string>();
            var stream = Stream.CreateFilteredStream();
            stream.AddTrack(searchInput);
            stream.AddTweetLanguageFilter(LanguageFilter.English);
            stream.MatchingTweetReceived += (sender, arguments) =>
            {
                tweets.Add(arguments.Tweet.Text);
                if (tweets.Count >= 2)
                {
                    stream.StopStream();
                }

            };
            stream.StartStreamMatchingAllConditions();
           return tweets;
        }

    }
}
