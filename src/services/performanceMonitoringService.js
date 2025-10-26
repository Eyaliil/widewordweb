import { supabase } from '../lib/supabaseClient';

/**
 * PERFORMANCE MONITORING AND METRICS SERVICE
 * 
 * This service provides comprehensive performance monitoring for the scalable matching system:
 * - Real-time performance metrics
 * - Query performance tracking
 * - Cache hit/miss ratios
 * - User engagement metrics
 * - System health monitoring
 * - Alerting and notifications
 */

export class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      // Query performance
      queryTimes: [],
      avgQueryTime: 0,
      maxQueryTime: 0,
      minQueryTime: Infinity,
      
      // Cache performance
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      
      // Matching performance
      totalMatches: 0,
      successfulMatches: 0,
      failedMatches: 0,
      matchSuccessRate: 0,
      
      // User engagement
      activeUsers: 0,
      totalUsers: 0,
      userEngagementRate: 0,
      
      // System health
      memoryUsage: 0,
      cpuUsage: 0,
      databaseConnections: 0,
      
      // Error tracking
      errors: [],
      errorRate: 0,
      
      // Timestamps
      lastUpdated: new Date(),
      startTime: Date.now()
    };
    
    this.alerts = [];
    this.thresholds = {
      // Performance thresholds
      maxQueryTime: 1000,        // 1 second
      minCacheHitRate: 0.7,     // 70%
      maxErrorRate: 0.05,        // 5%
      maxMemoryUsage: 0.8,       // 80%
      
      // Engagement thresholds
      minUserEngagement: 0.1,   // 10%
      minMatchSuccessRate: 0.3   // 30%
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) {
      console.log('⚠️ Performance monitoring already running');
      return;
    }

    console.log('📊 Starting performance monitoring service');
    this.isMonitoring = true;

    // Start monitoring interval (every 30 seconds)
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.updateMetrics();
    }, 30000);

    // Initial metrics collection
    this.collectMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      console.log('⚠️ Performance monitoring not running');
      return;
    }

    console.log('🛑 Stopping performance monitoring service');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Record query performance
   */
  recordQuery(queryName, duration, success = true) {
    const queryMetric = {
      name: queryName,
      duration: duration,
      success: success,
      timestamp: new Date().toISOString()
    };

    this.metrics.queryTimes.push(queryMetric);
    
    // Keep only last 1000 queries for memory efficiency
    if (this.metrics.queryTimes.length > 1000) {
      this.metrics.queryTimes = this.metrics.queryTimes.slice(-1000);
    }

    // Update query statistics
    this.updateQueryStats();

    // Log slow queries
    if (duration > this.thresholds.maxQueryTime) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
      this.recordAlert('slow_query', `Query ${queryName} took ${duration}ms`, 'warning');
    }

    // Log failed queries
    if (!success) {
      console.error(`❌ Query failed: ${queryName}`);
      this.recordAlert('query_failure', `Query ${queryName} failed`, 'error');
    }
  }

  /**
   * Record cache performance
   */
  recordCacheHit() {
    this.metrics.cacheHits++;
    this.updateCacheStats();
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
    this.updateCacheStats();
  }

  /**
   * Record matching performance
   */
  recordMatch(success = true) {
    this.metrics.totalMatches++;
    
    if (success) {
      this.metrics.successfulMatches++;
    } else {
      this.metrics.failedMatches++;
    }
    
    this.updateMatchStats();
  }

  /**
   * Record user engagement
   */
  recordUserActivity(userId, activityType) {
    // This would typically be stored in a user activity table
    // For now, we'll just update the active users count
    this.updateUserStats();
  }

  /**
   * Record system error
   */
  recordError(error, context = '') {
    const errorMetric = {
      message: error.message || error,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    };

    this.metrics.errors.push(errorMetric);
    
    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }

    this.updateErrorStats();
    
    // Log error
    console.error('❌ System error recorded:', errorMetric);
    
    // Check if error rate is too high
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      this.recordAlert('high_error_rate', `Error rate is ${(this.metrics.errorRate * 100).toFixed(2)}%`, 'critical');
    }
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    try {
      // Memory usage (browser-safe)
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memoryUsage = process.memoryUsage();
        this.metrics.memoryUsage = memoryUsage.heapUsed / memoryUsage.heapTotal;
      } else {
        // Browser environment - use performance.memory if available
        if (performance.memory) {
          this.metrics.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
        } else {
          this.metrics.memoryUsage = 0.5; // Default fallback
        }
      }

      // Database connection count (simplified)
      this.metrics.databaseConnections = 1; // Supabase manages connections

      // User statistics
      await this.updateUserStats();

      // Update timestamp
      this.metrics.lastUpdated = new Date();

    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
      this.recordError(error, 'collectMetrics');
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats() {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_profile_complete', true);

      if (totalError) {
        console.error('❌ Error getting total users:', totalError);
        return;
      }

      // Get active users (last 24 hours - using created_at as fallback)
      const { count: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_profile_complete', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (activeError) {
        console.error('❌ Error getting active users:', activeError);
        return;
      }

      this.metrics.totalUsers = totalUsers || 0;
      this.metrics.activeUsers = activeUsers || 0;
      this.metrics.userEngagementRate = this.metrics.totalUsers > 0 
        ? this.metrics.activeUsers / this.metrics.totalUsers 
        : 0;

    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      this.recordError(error, 'updateUserStats');
    }
  }

  /**
   * Update query statistics
   */
  updateQueryStats() {
    if (this.metrics.queryTimes.length === 0) return;

    const durations = this.metrics.queryTimes.map(q => q.duration);
    this.metrics.avgQueryTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    this.metrics.maxQueryTime = Math.max(...durations);
    this.metrics.minQueryTime = Math.min(...durations);
  }

  /**
   * Update cache statistics
   */
  updateCacheStats() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? this.metrics.cacheHits / total : 0;
  }

  /**
   * Update match statistics
   */
  updateMatchStats() {
    this.metrics.matchSuccessRate = this.metrics.totalMatches > 0 
      ? this.metrics.successfulMatches / this.metrics.totalMatches 
      : 0;
  }

  /**
   * Update error statistics
   */
  updateErrorStats() {
    const recentErrors = this.metrics.errors.filter(
      error => new Date(error.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    this.metrics.errorRate = recentErrors.length / Math.max(this.metrics.totalMatches, 1);
  }

  /**
   * Update all metrics
   */
  updateMetrics() {
    this.updateQueryStats();
    this.updateCacheStats();
    this.updateMatchStats();
    this.updateErrorStats();
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    // Check query performance
    if (this.metrics.avgQueryTime > this.thresholds.maxQueryTime) {
      this.recordAlert('slow_queries', `Average query time is ${this.metrics.avgQueryTime.toFixed(2)}ms`, 'warning');
    }

    // Check cache performance
    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      this.recordAlert('low_cache_hit_rate', `Cache hit rate is ${(this.metrics.cacheHitRate * 100).toFixed(2)}%`, 'warning');
    }

    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      this.recordAlert('high_memory_usage', `Memory usage is ${(this.metrics.memoryUsage * 100).toFixed(2)}%`, 'critical');
    }

    // Check user engagement
    if (this.metrics.userEngagementRate < this.thresholds.minUserEngagement) {
      this.recordAlert('low_user_engagement', `User engagement is ${(this.metrics.userEngagementRate * 100).toFixed(2)}%`, 'warning');
    }

    // Check match success rate
    if (this.metrics.matchSuccessRate < this.thresholds.minMatchSuccessRate) {
      this.recordAlert('low_match_success', `Match success rate is ${(this.metrics.matchSuccessRate * 100).toFixed(2)}%`, 'warning');
    }
  }

  /**
   * Record an alert
   */
  recordAlert(type, message, severity = 'info') {
    const alert = {
      type: type,
      message: message,
      severity: severity,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log alert
    const emoji = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} Alert: ${message}`);

    // Store alert in database
    this.storeAlert(alert);
  }

  /**
   * Store alert in database
   */
  async storeAlert(alert) {
    try {
      const { error } = await supabase
        .from('matching_performance_metrics')
        .insert({
          metric_name: `alert_${alert.type}`,
          metric_value: 1,
          metric_unit: 'count',
          recorded_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error storing alert:', error);
      }
    } catch (error) {
      console.error('❌ Error storing alert:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      alerts: this.alerts.filter(alert => !alert.resolved)
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const metrics = this.getMetrics();
    
    return {
      status: this.getSystemStatus(),
      performance: {
        avgQueryTime: Math.round(metrics.avgQueryTime),
        cacheHitRate: Math.round(metrics.cacheHitRate * 100),
        matchSuccessRate: Math.round(metrics.matchSuccessRate * 100),
        errorRate: Math.round(metrics.errorRate * 100)
      },
      engagement: {
        totalUsers: metrics.totalUsers,
        activeUsers: metrics.activeUsers,
        engagementRate: Math.round(metrics.userEngagementRate * 100)
      },
      system: {
        memoryUsage: Math.round(metrics.memoryUsage * 100),
        uptime: Math.round(metrics.uptime / 1000), // seconds
        alerts: metrics.alerts.length
      }
    };
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const metrics = this.getMetrics();
    
    if (metrics.alerts.some(alert => alert.severity === 'critical')) {
      return 'critical';
    } else if (metrics.alerts.some(alert => alert.severity === 'warning')) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get detailed performance report
   */
  getDetailedReport() {
    const metrics = this.getMetrics();
    const summary = this.getPerformanceSummary();
    
    return {
      summary: summary,
      details: {
        queryPerformance: {
          totalQueries: metrics.queryTimes.length,
          avgQueryTime: Math.round(metrics.avgQueryTime),
          maxQueryTime: metrics.maxQueryTime,
          minQueryTime: metrics.minQueryTime,
          slowQueries: metrics.queryTimes.filter(q => q.duration > this.thresholds.maxQueryTime).length
        },
        cachePerformance: {
          hits: metrics.cacheHits,
          misses: metrics.cacheMisses,
          hitRate: Math.round(metrics.cacheHitRate * 100)
        },
        matchingPerformance: {
          totalMatches: metrics.totalMatches,
          successfulMatches: metrics.successfulMatches,
          failedMatches: metrics.failedMatches,
          successRate: Math.round(metrics.matchSuccessRate * 100)
        },
        userEngagement: {
          totalUsers: metrics.totalUsers,
          activeUsers: metrics.activeUsers,
          engagementRate: Math.round(metrics.userEngagementRate * 100)
        },
        systemHealth: {
          memoryUsage: Math.round(metrics.memoryUsage * 100),
          errorCount: metrics.errors.length,
          errorRate: Math.round(metrics.errorRate * 100),
          uptime: Math.round(metrics.uptime / 1000)
        }
      },
      alerts: metrics.alerts,
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Get performance recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const metrics = this.getMetrics();

    // Query performance recommendations
    if (metrics.avgQueryTime > this.thresholds.maxQueryTime) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider optimizing database queries or adding more indexes',
        action: 'Review slow queries and add appropriate database indexes'
      });
    }

    // Cache performance recommendations
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        message: 'Cache hit rate is low, consider increasing cache TTL or improving cache strategy',
        action: 'Review cache configuration and increase TTL for frequently accessed data'
      });
    }

    // Memory usage recommendations
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Memory usage is high, consider implementing memory optimization',
        action: 'Review memory usage patterns and implement garbage collection optimization'
      });
    }

    // User engagement recommendations
    if (metrics.userEngagementRate < this.thresholds.minUserEngagement) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'User engagement is low, consider improving user experience',
        action: 'Review user onboarding flow and add more engaging features'
      });
    }

    // Match success rate recommendations
    if (metrics.matchSuccessRate < this.thresholds.minMatchSuccessRate) {
      recommendations.push({
        type: 'matching',
        priority: 'high',
        message: 'Match success rate is low, consider improving matching algorithm',
        action: 'Review matching criteria and adjust compatibility scoring'
      });
    }

    return recommendations;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      queryTimes: [],
      avgQueryTime: 0,
      maxQueryTime: 0,
      minQueryTime: Infinity,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalMatches: 0,
      successfulMatches: 0,
      failedMatches: 0,
      matchSuccessRate: 0,
      activeUsers: 0,
      totalUsers: 0,
      userEngagementRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      databaseConnections: 0,
      errors: [],
      errorRate: 0,
      lastUpdated: new Date(),
      startTime: Date.now()
    };
    
    this.alerts = [];
    console.log('✅ Performance metrics reset');
  }

  /**
   * Export metrics to file
   */
  exportMetrics() {
    const report = this.getDetailedReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${timestamp}.json`;
    
    // In a real implementation, you would write this to a file
    console.log(`📊 Performance report exported: ${filename}`);
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Create service instance
export const performanceMonitoringService = new PerformanceMonitoringService();
