using System;
using System.Collections.Generic;
using System.Text;

namespace TwitterCore
{
    interface ITwitter
    {
        List<string> GetTweets(string searchInput);
    }
}
