import { supabase } from '../lib/supabaseClient';

/**
 * REDIS-BASED CACHING SERVICE FOR SCALABLE MATCHING
 * 
 * This service provides high-performance caching for:
 * - Compatibility scores
 * - User profiles
 * - Search preferences
 * - Performance metrics
 * 
 * Designed to work with Redis in production, falls back to in-memory cache for development
 */

export class RedisCachingService {
  constructor() {
    this.redis = null; // Will be initialized with Redis connection
    this.memoryCache = new Map(); // Fallback for development
    this.isRedisAvailable = false;
    
    // Cache configuration
    this.config = {
      // TTL settings (in seconds)
      compatibilityScore: 3600,    // 1 hour
      userProfile: 1800,          // 30 minutes
      searchPreferences: 3600,     // 1 hour
      performanceMetrics: 300,     // 5 minutes
      userInterests: 1800,         // 30 minutes
      
      // Cache size limits
      maxMemoryCacheSize: 10000,
      
      // Key prefixes
      prefixes: {
        compatibility: 'comp',
        profile: 'prof',
        preferences: 'pref',
        metrics: 'metrics',
        interests: 'interests',
        performance: 'perf'
      }
    };
    
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      // In production, you would initialize Redis here
      // const Redis = require('redis');
      // this.redis = Redis.createClient({
      //   host: process.env.REDIS_HOST || 'localhost',
      //   port: process.env.REDIS_PORT || 6379,
      //   password: process.env.REDIS_PASSWORD
      // });
      
      // For now, we'll use in-memory cache
      console.log('🔄 Using in-memory cache (Redis not configured)');
      this.isRedisAvailable = false;
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Generic cache get method
   */
  async get(key) {
    try {
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Use memory cache
        const value = this.memoryCache.get(key);
        if (value && value.expiresAt > Date.now()) {
          return value.data;
        } else if (value) {
          // Expired, remove from cache
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Generic cache set method
   */
  async set(key, value, ttlSeconds = null) {
    try {
      if (this.isRedisAvailable && this.redis) {
        const serializedValue = JSON.stringify(value);
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, serializedValue);
        } else {
          await this.redis.set(key, serializedValue);
        }
      } else {
        // Use memory cache
        const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
        this.memoryCache.set(key, { data: value, expiresAt });
        
        // Clean up expired entries if cache is getting large
        if (this.memoryCache.size > this.config.maxMemoryCacheSize) {
          this.cleanupExpiredEntries();
        }
      }
    } catch (error) {
      console.error('❌ Cache set error:', error);
    }
  }

  /**
   * Cache compatibility score
   */
  async cacheCompatibilityScore(user1Id, user2Id, score, breakdown) {
    const key = this.getCompatibilityKey(user1Id, user2Id);
    const value = {
      score,
      breakdown,
      calculatedAt: new Date().toISOString()
    };
    
    await this.set(key, value, this.config.compatibilityScore);
  }

  /**
   * Get cached compatibility score
   */
  async getCachedCompatibilityScore(user1Id, user2Id) {
    const key = this.getCompatibilityKey(user1Id, user2Id);
    return await this.get(key);
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile) {
    const key = this.getProfileKey(userId);
    const value = {
      ...profile,
      cachedAt: new Date().toISOString()
    };
    
    await this.set(key, value, this.config.userProfile);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(userId) {
    const key = this.getProfileKey(userId);
    return await this.get(key);
  }

  /**
   * Cache search preferences
   */
  async cacheSearchPreferences(userId, preferences) {
    const key = this.getPreferencesKey(userId);
    const value = {
      ...preferences,
      cachedAt: new Date().toISOString()
    };
    
    await this.set(key, value, this.config.searchPreferences);
  }

  /**
   * Get cached search preferences
   */
  async getCachedSearchPreferences(userId) {
    const key = this.getPreferencesKey(userId);
    return await this.get(key);
  }

  /**
   * Cache user interests
   */
  async cacheUserInterests(userId, interests) {
    const key = this.getInterestsKey(userId);
    const value = {
      interests,
      cachedAt: new Date().toISOString()
    };
    
    await this.set(key, value, this.config.userInterests);
  }

  /**
   * Get cached user interests
   */
  async getCachedUserInterests(userId) {
    const key = this.getInterestsKey(userId);
    return await this.get(key);
  }

  /**
   * Cache performance metrics
   */
  async cachePerformanceMetrics(metrics) {
    const key = this.getMetricsKey();
    const value = {
      ...metrics,
      cachedAt: new Date().toISOString()
    };
    
    await this.set(key, value, this.config.performanceMetrics);
  }

  /**
   * Get cached performance metrics
   */
  async getCachedPerformanceMetrics() {
    const key = this.getMetricsKey();
    return await this.get(key);
  }

  /**
   * Invalidate cache entries for a user
   */
  async invalidateUserCache(userId) {
    const keys = [
      this.getProfileKey(userId),
      this.getPreferencesKey(userId),
      this.getInterestsKey(userId)
    ];
    
    for (const key of keys) {
      await this.delete(key);
    }
    
    // Also invalidate compatibility scores involving this user
    await this.invalidateCompatibilityScores(userId);
  }

  /**
   * Invalidate compatibility scores for a user
   */
  async invalidateCompatibilityScores(userId) {
    try {
      if (this.isRedisAvailable && this.redis) {
        // Use Redis pattern matching to find and delete keys
        const pattern = `${this.config.prefixes.compatibility}:*:${userId}`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // For memory cache, we need to iterate through all keys
        const keysToDelete = [];
        for (const [key, value] of this.memoryCache.entries()) {
          if (key.includes(`:${userId}`) && key.startsWith(this.config.prefixes.compatibility)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      console.error('❌ Error invalidating compatibility scores:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache() {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.flushall();
      } else {
        this.memoryCache.clear();
      }
      console.log('✅ All cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      if (this.isRedisAvailable && this.redis) {
        const info = await this.redis.info('memory');
        return {
          type: 'Redis',
          memoryUsage: info,
          keyCount: await this.redis.dbsize()
        };
      } else {
        return {
          type: 'Memory',
          keyCount: this.memoryCache.size,
          maxSize: this.config.maxMemoryCacheSize
        };
      }
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return { type: 'Unknown', error: error.message };
    }
  }

  /**
   * Clean up expired entries from memory cache
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt && value.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
  }

  /**
   * Delete a specific key
   */
  async delete(key) {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('❌ Cache delete error:', error);
    }
  }

  /**
   * Key generation methods
   */
  getCompatibilityKey(user1Id, user2Id) {
    const [id1, id2] = [user1Id, user2Id].sort();
    return `${this.config.prefixes.compatibility}:${id1}:${id2}`;
  }

  getProfileKey(userId) {
    return `${this.config.prefixes.profile}:${userId}`;
  }

  getPreferencesKey(userId) {
    return `${this.config.prefixes.preferences}:${userId}`;
  }

  getInterestsKey(userId) {
    return `${this.config.prefixes.interests}:${userId}`;
  }

  getMetricsKey() {
    return `${this.config.prefixes.metrics}:global`;
  }
}

/**
 * BACKGROUND PROCESSING SERVICE
 * 
 * This service handles background tasks for the scalable matching system:
 * - Pre-calculating compatibility scores
 * - Updating cache
 * - Performance monitoring
 * - Database maintenance
 */

export class BackgroundProcessingService {
  constructor(cachingService) {
    this.cachingService = cachingService;
    this.isRunning = false;
    this.intervals = new Map();
    
    // Configuration
    this.config = {
      // Processing intervals (in milliseconds)
      compatibilityPrecalc: 5 * 60 * 1000,    // 5 minutes
      cacheCleanup: 10 * 60 * 1000,           // 10 minutes
      performanceMetrics: 1 * 60 * 1000,      // 1 minute
      databaseMaintenance: 60 * 60 * 1000,    // 1 hour
      
      // Batch sizes
      compatibilityBatchSize: 100,
      cacheCleanupBatchSize: 1000,
      
      // Performance thresholds
      maxProcessingTime: 30000, // 30 seconds
      maxMemoryUsage: 0.8       // 80% of available memory
    };
  }

  /**
   * Start background processing
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Background processing already running');
      return;
    }

    console.log('🚀 Starting background processing service');
    this.isRunning = true;

    // Start various background tasks
    this.startCompatibilityPrecalculation();
    this.startCacheCleanup();
    this.startPerformanceMonitoring();
    this.startDatabaseMaintenance();
  }

  /**
   * Stop background processing
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Background processing not running');
      return;
    }

    console.log('🛑 Stopping background processing service');
    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach((intervalId, taskName) => {
      clearInterval(intervalId);
      console.log(`✅ Stopped ${taskName}`);
    });
    this.intervals.clear();
  }

  /**
   * Start compatibility score pre-calculation
   */
  startCompatibilityPrecalculation() {
    const intervalId = setInterval(async () => {
      try {
        await this.precalculateCompatibilityScores();
      } catch (error) {
        console.error('❌ Error in compatibility pre-calculation:', error);
      }
    }, this.config.compatibilityPrecalc);

    this.intervals.set('compatibilityPrecalc', intervalId);
    console.log('✅ Started compatibility pre-calculation');
  }

  /**
   * Start cache cleanup
   */
  startCacheCleanup() {
    const intervalId = setInterval(async () => {
      try {
        await this.cleanupCache();
      } catch (error) {
        console.error('❌ Error in cache cleanup:', error);
      }
    }, this.config.cacheCleanup);

    this.intervals.set('cacheCleanup', intervalId);
    console.log('✅ Started cache cleanup');
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    const intervalId = setInterval(async () => {
      try {
        await this.collectPerformanceMetrics();
      } catch (error) {
        console.error('❌ Error in performance monitoring:', error);
      }
    }, this.config.performanceMetrics);

    this.intervals.set('performanceMonitoring', intervalId);
    console.log('✅ Started performance monitoring');
  }

  /**
   * Start database maintenance
   */
  startDatabaseMaintenance() {
    const intervalId = setInterval(async () => {
      try {
        await this.performDatabaseMaintenance();
      } catch (error) {
        console.error('❌ Error in database maintenance:', error);
      }
    }, this.config.databaseMaintenance);

    this.intervals.set('databaseMaintenance', intervalId);
    console.log('✅ Started database maintenance');
  }

  /**
   * Pre-calculate compatibility scores for active users
   */
  async precalculateCompatibilityScores() {
    const startTime = Date.now();
    console.log('🔄 Starting compatibility score pre-calculation');

    try {
      // Get active users (users who have been online recently - using created_at as fallback)
      const { data: activeUsers, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_profile_complete', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .limit(this.config.compatibilityBatchSize);

      if (error) {
        console.error('❌ Error fetching active users:', error);
        return;
      }

      if (!activeUsers || activeUsers.length === 0) {
        console.log('ℹ️ No active users found for pre-calculation');
        return;
      }

      let processedPairs = 0;
      const userIds = activeUsers.map(u => u.user_id);

      // Process user pairs in batches
      for (let i = 0; i < userIds.length; i++) {
        for (let j = i + 1; j < userIds.length; j++) {
          const user1Id = userIds[i];
          const user2Id = userIds[j];

          // Check if compatibility score is already cached
          const cachedScore = await this.cachingService.getCachedCompatibilityScore(user1Id, user2Id);
          if (cachedScore) {
            continue; // Skip if already cached
          }

          // Calculate and cache compatibility score
          await this.calculateAndCacheCompatibility(user1Id, user2Id);
          processedPairs++;

          // Limit processing time
          if (Date.now() - startTime > this.config.maxProcessingTime) {
            console.log('⏰ Pre-calculation time limit reached');
            break;
          }
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Pre-calculated ${processedPairs} compatibility scores in ${processingTime}ms`);

    } catch (error) {
      console.error('❌ Error in compatibility pre-calculation:', error);
    }
  }

  /**
   * Calculate and cache compatibility score for two users
   */
  async calculateAndCacheCompatibility(user1Id, user2Id) {
    try {
      // Get user profiles
      const [user1, user2] = await Promise.all([
        this.getUserProfileForCalculation(user1Id),
        this.getUserProfileForCalculation(user2Id)
      ]);

      if (!user1 || !user2) {
        return;
      }

      // Calculate compatibility score
      const compatibility = this.calculateCompatibilityScore(user1, user2);

      // Cache the result
      await this.cachingService.cacheCompatibilityScore(
        user1Id,
        user2Id,
        compatibility.score,
        compatibility.breakdown
      );

    } catch (error) {
      console.error(`❌ Error calculating compatibility for ${user1Id} and ${user2Id}:`, error);
    }
  }

  /**
   * Get user profile for calculation (with caching)
   */
  async getUserProfileForCalculation(userId) {
    // Try cache first
    let profile = await this.cachingService.getCachedUserProfile(userId);
    
    if (!profile) {
      // Fetch from database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          age,
          city,
          bio,
          avatar_type,
          avatar_emoji,
          gender_id,
          pronouns_id,
          latitude,
          longitude
        `)
        .eq('user_id', userId)
        .eq('is_profile_complete', true)
        .single();

      if (error || !profileData) {
        return null;
      }

      // Get interests
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('interests(label)')
        .eq('user_id', userId);

      const interests = interestsData?.map(ui => ui.interests.label) || [];

      // Get gender and pronouns
      let gender = 'Unknown';
      let pronouns = '';
      
      if (profileData.gender_id) {
        const { data: genderData } = await supabase
          .from('genders')
          .select('label')
          .eq('id', profileData.gender_id)
          .single();
        gender = genderData?.label || 'Unknown';
      }

      if (profileData.pronouns_id) {
        const { data: pronounsData } = await supabase
          .from('pronouns')
          .select('label')
          .eq('id', profileData.pronouns_id)
          .single();
        pronouns = pronounsData?.label || '';
      }

      profile = {
        id: profileData.user_id,
        name: profileData.name,
        age: profileData.age,
        gender: gender,
        pronouns: pronouns,
        city: profileData.city,
        bio: profileData.bio || '',
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        interests: interests
      };

      // Cache the profile
      await this.cachingService.cacheUserProfile(userId, profile);
    }

    return profile;
  }

  /**
   * Simplified compatibility calculation for background processing
   */
  calculateCompatibilityScore(user1, user2) {
    let score = 0;
    let breakdown = {};

    // Interest matching (40 points max)
    const user1Interests = user1.interests || [];
    const user2Interests = user2.interests || [];
    const commonInterests = user1Interests.filter(interest => 
      user2Interests.includes(interest)
    );
    
    const interestScore = Math.min(commonInterests.length * 10, 40);
    score += interestScore;
    breakdown.interests = interestScore;

    // Age compatibility (25 points max)
    const ageDiff = Math.abs(user1.age - user2.age);
    let ageScore = 0;
    
    if (ageDiff === 0) ageScore = 25;
    else if (ageDiff <= 1) ageScore = 23;
    else if (ageDiff <= 3) ageScore = 20;
    else if (ageDiff <= 5) ageScore = 15;
    else if (ageDiff <= 8) ageScore = 10;
    else if (ageDiff <= 12) ageScore = 5;
    else ageScore = 2;
    
    score += ageScore;
    breakdown.age = ageScore;

    // Gender compatibility (20 points max)
    const genderCompatible = this.isGenderCompatible(user1.gender, user2.gender);
    const genderScore = genderCompatible ? 20 : 0;
    score += genderScore;
    breakdown.gender = genderScore;

    // Location compatibility (15 points max)
    let locationScore = 0;
    if (user1.city === user2.city) {
      locationScore = 15;
    } else if (user1.latitude && user2.latitude && user1.longitude && user2.longitude) {
      const distance = this.calculateDistance(
        user1.latitude, user1.longitude,
        user2.latitude, user2.longitude
      );
      
      if (distance <= 10) locationScore = 12;
      else if (distance <= 25) locationScore = 10;
      else if (distance <= 50) locationScore = 7;
      else locationScore = 3;
    } else if (user1.city && user2.city) {
      locationScore = 3;
    }
    
    score += locationScore;
    breakdown.location = locationScore;

    // Calculate final percentage
    const maxPossibleScore = 40 + 25 + 20 + 15; // 100 max
    const percentage = Math.round((score / maxPossibleScore) * 100);

    return { 
      score: percentage, 
      breakdown 
    };
  }

  /**
   * Utility functions
   */
  isGenderCompatible(gender1, gender2) {
    const compatiblePairs = [
      ['Male', 'Female'],
      ['Female', 'Male'],
      ['Non-binary', 'Non-binary'],
      ['Non-binary', 'Male'],
      ['Non-binary', 'Female'],
      ['Male', 'Non-binary'],
      ['Female', 'Non-binary']
    ];
    
    return compatiblePairs.some(pair => 
      (pair[0] === gender1 && pair[1] === gender2) ||
      (pair[0] === gender2 && pair[1] === gender1)
    );
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache() {
    console.log('🧹 Starting cache cleanup');
    
    try {
      const stats = await this.cachingService.getCacheStats();
      console.log(`📊 Cache stats before cleanup:`, stats);

      // For Redis, expired entries are automatically cleaned up
      // For memory cache, we need to manually clean up
      if (!this.cachingService.isRedisAvailable) {
        this.cachingService.cleanupExpiredEntries();
      }

      const statsAfter = await this.cachingService.getCacheStats();
      console.log(`📊 Cache stats after cleanup:`, statsAfter);

    } catch (error) {
      console.error('❌ Error in cache cleanup:', error);
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        cacheStats: await this.cachingService.getCacheStats(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };

      // Cache the metrics
      await this.cachingService.cachePerformanceMetrics(metrics);

      // Store in database for historical analysis
      await this.storePerformanceMetrics(metrics);

    } catch (error) {
      console.error('❌ Error collecting performance metrics:', error);
    }
  }

  /**
   * Store performance metrics in database
   */
  async storePerformanceMetrics(metrics) {
    try {
      const metricsToStore = [
        {
          metric_name: 'cache_key_count',
          metric_value: metrics.cacheStats.keyCount || 0,
          metric_unit: 'count'
        },
        {
          metric_name: 'memory_usage_mb',
          metric_value: metrics.memoryUsage.heapUsed / 1024 / 1024,
          metric_unit: 'MB'
        },
        {
          metric_name: 'uptime_seconds',
          metric_value: metrics.uptime,
          metric_unit: 'seconds'
        }
      ];

      const { error } = await supabase
        .from('matching_performance_metrics')
        .insert(metricsToStore);

      if (error) {
        console.error('❌ Error storing performance metrics:', error);
      }

    } catch (error) {
      console.error('❌ Error storing performance metrics:', error);
    }
  }

  /**
   * Perform database maintenance tasks
   */
  async performDatabaseMaintenance() {
    console.log('🔧 Starting database maintenance');

    try {
      // Clean up expired matches
      const { error: matchesError } = await supabase
        .from('matches')
        .update({ 
          status: 'expired',
          completed_at: new Date().toISOString()
        })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString());

      if (matchesError) {
        console.error('❌ Error cleaning up expired matches:', matchesError);
      } else {
        console.log('✅ Cleaned up expired matches');
      }

      // Clean up expired cache entries from database
      const { error: cacheError } = await supabase
        .from('compatibility_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (cacheError) {
        console.error('❌ Error cleaning up expired cache entries:', cacheError);
      } else {
        console.log('✅ Cleaned up expired cache entries');
      }

      // Update user activity status (using updated_at as fallback)
      const { error: activityError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('is_profile_complete', true)
        .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (activityError) {
        console.error('❌ Error updating user activity:', activityError);
      } else {
        console.log('✅ Updated user activity status');
      }

    } catch (error) {
      console.error('❌ Error in database maintenance:', error);
    }
  }
}

// Create service instances
export const redisCachingService = new RedisCachingService();
export const backgroundProcessingService = new BackgroundProcessingService(redisCachingService);
