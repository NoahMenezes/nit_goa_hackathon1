// X/Twitter API Client
// Handles authentication and posting to X (formerly Twitter)

import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2';

export interface TweetContent {
  text: string;
  mediaIds?: string[];
  replyToTweetId?: string;
}

export interface TweetResult {
  success: boolean;
  tweetId?: string;
  url?: string;
  error?: string;
}

export class TwitterClient {
  private client: TwitterApiReadWrite | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Get credentials from environment variables
      const apiKey = process.env.TWITTER_API_KEY || process.env.X_API_KEY;
      const apiSecret = process.env.TWITTER_API_SECRET || process.env.X_API_SECRET;
      const accessToken = process.env.TWITTER_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN;
      const accessSecret = process.env.TWITTER_ACCESS_SECRET || process.env.X_ACCESS_SECRET;

      if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        console.warn(
          '⚠️  X/Twitter credentials not configured. Social media posting disabled.\n' +
          '   Required environment variables:\n' +
          '   - TWITTER_API_KEY (or X_API_KEY)\n' +
          '   - TWITTER_API_SECRET (or X_API_SECRET)\n' +
          '   - TWITTER_ACCESS_TOKEN (or X_ACCESS_TOKEN)\n' +
          '   - TWITTER_ACCESS_SECRET (or X_ACCESS_SECRET)'
        );
        this.isConfigured = false;
        return;
      }

      // Initialize Twitter API client
      const twitterClient = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      this.client = twitterClient.readWrite;
      this.isConfigured = true;

      console.log('✅ X/Twitter client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize X/Twitter client:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if Twitter client is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Post a tweet to X/Twitter
   */
  public async postTweet(content: TweetContent): Promise<TweetResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'X/Twitter client not configured. Please set up API credentials.',
      };
    }

    try {
      // Validate tweet length (280 characters for X)
      if (content.text.length > 280) {
        return {
          success: false,
          error: `Tweet too long: ${content.text.length} characters (max 280)`,
        };
      }

      if (content.text.length === 0) {
        return {
          success: false,
          error: 'Tweet text cannot be empty',
        };
      }

      console.log(`📤 Posting tweet: "${content.text.substring(0, 50)}..."`);

      // Post the tweet
      const tweet = await this.client!.v2.tweet({
        text: content.text,
        ...(content.mediaIds && { media: { media_ids: content.mediaIds } }),
        ...(content.replyToTweetId && { reply: { in_reply_to_tweet_id: content.replyToTweetId } }),
      });

      const tweetId = tweet.data.id;
      const tweetUrl = `https://twitter.com/i/web/status/${tweetId}`;

      console.log(`✅ Tweet posted successfully: ${tweetUrl}`);

      return {
        success: true,
        tweetId,
        url: tweetUrl,
      };
    } catch (error: any) {
      console.error('Error posting tweet:', error);

      // Handle specific Twitter API errors
      let errorMessage = 'Failed to post tweet';

      if (error.code === 403) {
        errorMessage = 'Authentication failed. Check your X/Twitter API credentials.';
      } else if (error.code === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload media (image) to X/Twitter
   * @param mediaBuffer - Buffer containing image data
   * @param mimeType - MIME type of the media (e.g., 'image/jpeg', 'image/png')
   */
  public async uploadMedia(mediaBuffer: Buffer, mimeType: string): Promise<string | null> {
    if (!this.isReady()) {
      console.error('X/Twitter client not configured');
      return null;
    }

    try {
      console.log(`📤 Uploading media (${mimeType})...`);

      const mediaId = await this.client!.v1.uploadMedia(mediaBuffer, { mimeType });

      console.log(`✅ Media uploaded successfully: ${mediaId}`);

      return mediaId;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  /**
   * Post a tweet thread (multiple connected tweets)
   */
  public async postThread(tweets: string[]): Promise<TweetResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'X/Twitter client not configured',
      };
    }

    if (tweets.length === 0) {
      return {
        success: false,
        error: 'Thread must contain at least one tweet',
      };
    }

    try {
      console.log(`📤 Posting thread with ${tweets.length} tweets...`);

      let previousTweetId: string | undefined;
      let firstTweetId: string | undefined;

      for (let i = 0; i < tweets.length; i++) {
        const result = await this.postTweet({
          text: tweets[i],
          replyToTweetId: previousTweetId,
        });

        if (!result.success) {
          return result;
        }

        if (i === 0) {
          firstTweetId = result.tweetId;
        }
        previousTweetId = result.tweetId;

        // Add delay between tweets to avoid rate limits
        if (i < tweets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const threadUrl = `https://twitter.com/i/web/status/${firstTweetId}`;

      console.log(`✅ Thread posted successfully: ${threadUrl}`);

      return {
        success: true,
        tweetId: firstTweetId,
        url: threadUrl,
      };
    } catch (error) {
      console.error('Error posting thread:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post thread',
      };
    }
  }

  /**
   * Verify credentials are working
   */
  public async verifyCredentials(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const user = await this.client!.v2.me();
      console.log(`✅ Authenticated as @${user.data.username}`);
      return true;
    } catch (error) {
      console.error('Failed to verify X/Twitter credentials:', error);
      return false;
    }
  }

  /**
   * Get account information
   */
  public async getAccountInfo(): Promise<{ username: string; name: string } | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const user = await this.client!.v2.me();
      return {
        username: user.data.username,
        name: user.data.name,
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }
}

// Singleton instance
let twitterClientInstance: TwitterClient | null = null;

/**
 * Get or create the Twitter client singleton
 */
export function getTwitterClient(): TwitterClient {
  if (!twitterClientInstance) {
    twitterClientInstance = new TwitterClient();
  }
  return twitterClientInstance;
}

/**
 * Check if Twitter posting is enabled
 */
export function isTwitterEnabled(): boolean {
  const client = getTwitterClient();
  return client.isReady();
}

/**
 * Quick helper to post a tweet
 */
export async function tweet(text: string): Promise<TweetResult> {
  const client = getTwitterClient();
  return client.postTweet({ text });
}
