import { PerformanceService } from '../PerformanceService';

describe('PerformanceService (in-repo monitoring API)', () => {
  let service: PerformanceService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new PerformanceService({
      enableMonitoring: false,
      sampleRate: 1000,
      alertThresholds: { responseTime: 3000, memoryUsage: 80, cpuUsage: 80 },
    });
  });

  afterEach(() => {
    service.stopMonitoring();
    jest.useRealTimers();
  });

  it('starts with no metrics', () => {
    expect(service.getMetrics()).toEqual([]);
    expect(service.getLatestMetrics()).toBeNull();
  });

  it('recordMetric appends a typed metric', async () => {
    await service.recordMetric('response_time', 42, { route: '/home' });
    const latest = service.getLatestMetrics();
    expect(latest).not.toBeNull();
    expect(latest!.responseTime).toBe(42);
    expect(latest!.memoryUsage).toBe(0);
    expect(latest!.cpuUsage).toBe(0);
    expect(latest!.metadata).toEqual({ route: '/home' });
    expect(service.getMetrics()).toHaveLength(1);
  });

  it('clearMetrics empties the buffer', async () => {
    await service.recordMetric('memory_usage', 55);
    service.clearMetrics();
    expect(service.getMetrics()).toEqual([]);
    expect(service.getLatestMetrics()).toBeNull();
  });

  it('getAverageMetrics returns null when empty and averages when present', async () => {
    expect(service.getAverageMetrics()).toBeNull();
    await service.recordMetric('response_time', 10);
    await service.recordMetric('response_time', 30);
    const avg = service.getAverageMetrics();
    expect(avg).not.toBeNull();
    expect(avg!.responseTime).toBe(20);
  });

  it('getRecentActivity respects limit', async () => {
    await service.recordMetric('cpu_usage', 1);
    await service.recordMetric('cpu_usage', 2);
    await service.recordMetric('cpu_usage', 3);
    const recent = await service.getRecentActivity(2);
    expect(recent).toHaveLength(2);
    expect(recent[1].cpuUsage).toBe(3);
  });

  it('exportMetrics json/csv/xlsx shapes', async () => {
    await service.recordMetric('response_time', 100);
    const start = new Date(Date.now() - 60_000);
    const end = new Date(Date.now() + 60_000);
    const asJson = await service.exportMetrics(start, end, 'json');
    expect(Array.isArray(asJson)).toBe(true);
    expect((asJson as PerformanceMetricsLike[]).length).toBe(1);

    const asCsv = await service.exportMetrics(start, end, 'csv');
    expect(typeof asCsv).toBe('string');
    expect(asCsv as string).toContain('timestamp,responseTime,memoryUsage,cpuUsage');

    const asXlsx = await service.exportMetrics(start, end, 'xlsx');
    expect(asXlsx).toHaveProperty('headers');
    expect(asXlsx).toHaveProperty('data');
  });

  it('getDashboardMetrics returns the stub dashboard shape', async () => {
    await service.recordMetric('response_time', 12);
    const dash = await service.getDashboardMetrics();
    expect(dash.totalUsers).toBe(1250);
    expect(dash.activeUsers).toBe(890);
    expect(dash.totalCourses).toBe(45);
    expect(dash.completionRate).toBe(78.5);
    expect(dash.responseTime).toBe(12);
    expect(dash.timestamp).toBeInstanceOf(Date);
  });

  it('getSystemHealth reports healthy for low responseTime', async () => {
    await service.recordMetric('response_time', 10);
    const health = await service.getSystemHealth();
    expect(health.status).toBe('healthy');
    expect(health.uptime).toBe(99.8);
    expect(health.responseTime).toBe(10);
  });

  it('startMonitoring collects on interval when enabled', () => {
    const mon = new PerformanceService({ enableMonitoring: true, sampleRate: 1000 });
    mon.startMonitoring();
    expect(mon.getMetrics()).toHaveLength(0);
    jest.advanceTimersByTime(1000);
    expect(mon.getMetrics().length).toBeGreaterThanOrEqual(1);
    mon.stopMonitoring();
  });
});

type PerformanceMetricsLike = {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
};
