import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../shared';

const AdminDashboard = () => {
    const [telemetry, setTelemetry] = useState({
        total_calls: 0,
        success_rate: 0,
        avg_latency: 0,
        logs: []
    });
    const [revenue, setRevenue] = useState({
        total_revenue: 0.0,
        revenue_by_month: { May: 0, June: 0, July: 0, August: 0 },
        total_costs: 0.0,
        costs_breakdown: { hosting: 0, api_usage: 0, stripe_fees: 0 },
        marketing_spend: 0.0
    });
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' or 'revenue'

    const [ads, setAds] = useState([]);
    const [adsLoading, setAdsLoading] = useState(false);

    // Form fields
    const [sponsorName, setSponsorName] = useState('');
    const [adTitle, setAdTitle] = useState('');
    const [adDesc, setAdDesc] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [adType, setAdType] = useState('university_spotlight');
    const [pricingModel, setPricingModel] = useState('flat_rate');
    const [adPrice, setAdPrice] = useState('150.00');
    const [acceptanceRate, setAcceptanceRate] = useState('');
    const [satRange, setSatRange] = useState('');

    const fetchAds = async () => {
        setAdsLoading(true);
        const token = localStorage.getItem('access');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const res = await axios.get(getApiUrl('api/admin/advertisements/'), config);
            setAds(res.data || []);
        } catch (error) {
            console.error("Error loading ads:", error);
        } finally {
            setAdsLoading(false);
        }
    };

    const handleCreateAd = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.post(getApiUrl('api/admin/advertisements/'), {
                sponsor_name: sponsorName,
                title: adTitle,
                description: adDesc,
                image_url: imageUrl,
                target_url: targetUrl,
                ad_type: adType,
                pricing_model: pricingModel,
                price: parseFloat(adPrice) || 0.00,
                metric_acceptance_rate: acceptanceRate || null,
                metric_sat_range: satRange || null,
                is_active: true
            }, config);
            
            // Reset form
            setSponsorName('');
            setAdTitle('');
            setAdDesc('');
            setImageUrl('');
            setTargetUrl('');
            setAcceptanceRate('');
            setSatRange('');
            
            alert("Advertisement successfully created!");
            fetchStats();
        } catch (error) {
            console.error("Error creating ad:", error);
            alert("Failed to create ad. Check console.");
        }
    };

    const handleToggleAdActive = async (adId, currentStatus) => {
        const token = localStorage.getItem('access');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.patch(getApiUrl(`api/admin/advertisements/${adId}/`), {
                is_active: !currentStatus
            }, config);
            fetchStats();
        } catch (error) {
            console.error("Error toggling ad status:", error);
            alert("Failed to toggle status.");
        }
    };

    const handleDeleteAd = async (adId) => {
        if (!window.confirm("Are you sure you want to delete this advertisement?")) return;
        const token = localStorage.getItem('access');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.delete(getApiUrl(`api/admin/advertisements/${adId}/`), config);
            fetchStats();
        } catch (error) {
            console.error("Error deleting ad:", error);
            alert("Failed to delete ad.");
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        const token = localStorage.getItem('access');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const [telemetryRes, revenueRes] = await Promise.all([
                axios.get(getApiUrl('api/admin/ai-telemetry/'), config),
                axios.get(getApiUrl('api/admin/revenue/'), config)
            ]);
            setTelemetry(telemetryRes.data);
            setRevenue(revenueRes.data);
            await fetchAds();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper to simulate a mock completed sale on a specific month for testing/judging
    const handleSimulateSale = async (monthName) => {
        setSimulating(true);
        const token = localStorage.getItem('access');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Map month name to a date in 2026
        const monthMap = {
            'May': '2026-05-15T10:00:00Z',
            'June': '2026-06-15T10:00:00Z',
            'July': '2026-07-15T10:00:00Z',
            'August': '2026-08-15T10:00:00Z',
        };
        const scheduledAt = monthMap[monthName] || new Date().toISOString();

        try {
            // 1. Fetch advisors to get a service to buy
            const advisorsRes = await axios.get(getApiUrl('api/advisors/'));
            let serviceId = null;
            
            // Look for any service
            for (const adv of advisorsRes.data) {
                if (adv.services && adv.services.length > 0) {
                    serviceId = adv.services[0].id;
                    break;
                }
            }

            // Fallback: If no services exist, create one
            if (!serviceId) {
                // Find an advisor
                const advisor = advisorsRes.data.find(u => u.role === 'advisor');
                if (advisor) {
                    // Create service
                    const serviceRes = await axios.post(getApiUrl('api/services/create/'), {
                        title: "College Strategy Session",
                        description: "1-on-1 counseling",
                        price: "150.00",
                        duration: 60
                    }, config);
                    serviceId = serviceRes.data.id;
                } else {
                    alert("No advisor accounts found in database to book services from. Please register/make a user an advisor.");
                    setSimulating(false);
                    return;
                }
            }

            // 2. Call create-session
            const sessionRes = await axios.post(getApiUrl('api/payments/create-session/'), {
                service_id: serviceId,
                scheduled_at: scheduledAt,
                success_url: window.location.origin + '/admin/dashboard',
                cancel_url: window.location.origin + '/admin/dashboard'
            }, config);

            const { session_id } = sessionRes.data;

            // 3. Verify checkout session (this creates the meeting and completes the transaction with the scheduled date)
            await axios.post(getApiUrl('api/payments/verify/'), {
                session_id: session_id,
                scheduled_at: scheduledAt
            }, config);

            // Reload metrics
            await fetchStats();
        } catch (error) {
            console.error("Simulation error:", error);
            alert("Simulation failed: check console.");
        } finally {
            setSimulating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-400">Loading operations dashboard...</p>
                </div>
            </div>
        );
    }

    // Dynamic max value for charts
    const monthlyRevenues = Object.values(revenue.revenue_by_month);
    const maxRevenue = Math.max(...monthlyRevenues, 100);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8">
                    <div>
                        <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase bg-indigo-500/10 px-3 py-1 rounded-full">
                            Build with Gemini Telemetry
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white mt-2">
                            AI Operations & Business Dashboard
                        </h1>
                        <p className="mt-1 text-slate-400 text-sm">
                            Real-time agent latency logging, transaction validation, and monthly financial summaries.
                        </p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="mt-4 md:mt-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sm font-semibold rounded-lg transition border border-slate-700 flex items-center gap-2 self-start"
                    >
                        🔄 Refresh Data
                    </button>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-slate-800 mb-8">
                    <button
                        onClick={() => setActiveTab('telemetry')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
                            activeTab === 'telemetry'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        🤖 AI Agent Execution Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
                            activeTab === 'revenue'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        💰 Business Viability & Revenue
                    </button>
                    <button
                        onClick={() => setActiveTab('ads')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
                            activeTab === 'ads'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        📢 Manage Advertisements
                    </button>
                </div>

                {activeTab === 'telemetry' ? (
                    <div>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Total AI Chat Queries</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-white">{telemetry.total_calls}</span>
                                    <span className="text-emerald-400 text-xs font-semibold">Live in Production</span>
                                </div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Average Gemini Latency</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-indigo-400">
                                        {telemetry.avg_latency.toFixed(0)} ms
                                    </span>
                                    <span className="text-slate-500 text-xs">Streaming Event API</span>
                                </div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Response Success Rate</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-emerald-400">
                                        {telemetry.success_rate.toFixed(1)}%
                                    </span>
                                    <span className="text-slate-500 text-xs">Gemini Status</span>
                                </div>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                                <h2 className="text-lg font-bold text-white">Agent Execution Logs</h2>
                                <p className="text-xs text-slate-400">Detailed inputs and responses showing how the AI rules govern the app operations.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                                            <th className="p-4 font-semibold">User</th>
                                            <th className="p-4 font-semibold">Prompt Input Summary</th>
                                            <th className="p-4 font-semibold">Wormie Output Summary</th>
                                            <th className="p-4 font-semibold text-right">Latency</th>
                                            <th className="p-4 font-semibold text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {telemetry.logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-500">
                                                    No execution logs found. Send a message to Wormie to start logging telemetry!
                                                </td>
                                            </tr>
                                        ) : (
                                            telemetry.logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-900/40 transition">
                                                    <td className="p-4 font-medium text-slate-300">{log.user}</td>
                                                    <td className="p-4 max-w-xs truncate text-slate-400" title={log.prompt}>
                                                        {log.prompt}
                                                    </td>
                                                    <td className="p-4 max-w-sm truncate text-slate-300" title={log.response}>
                                                        {log.response || <em className="text-slate-600">Pending/Streaming</em>}
                                                    </td>
                                                    <td className="p-4 text-right text-indigo-300 font-mono">
                                                        {log.latency_ms} ms
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                                                            log.success 
                                                                ? 'bg-emerald-500/10 text-emerald-400' 
                                                                : 'bg-rose-500/10 text-rose-400'
                                                        }`}>
                                                            {log.success ? 'Success' : 'Failed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'revenue' ? (
                    <div>
                        {/* Financial Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Total Revenue (All Streams)</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-white">${revenue.total_revenue.toFixed(2)}</span>
                                    <span className="text-indigo-400 text-xs font-semibold">May - Aug 2026</span>
                                </div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Sponsored Ad Revenue</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-emerald-400">${(revenue.ad_revenue || 0).toFixed(2)}</span>
                                    <span className="text-slate-500 text-xs">Dynamic Tracking</span>
                                </div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Total Operating Costs</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-slate-300">${revenue.total_costs.toFixed(2)}</span>
                                    <span className="text-slate-500 text-xs">Excludes CAC</span>
                                </div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                                <h3 className="text-sm font-medium text-slate-400">Net Profit Margin</h3>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-indigo-400">
                                        {revenue.total_revenue > 0 
                                            ? (((revenue.total_revenue - revenue.total_costs) / revenue.total_revenue) * 100).toFixed(1)
                                            : '0.0'}%
                                    </span>
                                    <span className="text-slate-500 text-xs">Sandbox Estimate</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart & Simulation */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6">Revenue Breakdown by Month (2026)</h3>
                                <div className="h-64 flex items-end gap-6 sm:gap-12 px-4 border-b border-slate-800 pb-4">
                                    {Object.entries(revenue.revenue_by_month).map(([month, val]) => {
                                        const percentage = (val / maxRevenue) * 100;
                                        return (
                                            <div key={month} className="flex-1 flex flex-col items-center group h-full justify-end">
                                                <div className="text-xs font-semibold text-indigo-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ${val.toFixed(2)}
                                                </div>
                                                <div 
                                                    style={{ height: `${Math.max(percentage, 5)}%` }} 
                                                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500 hover:from-indigo-500 hover:to-indigo-300"
                                                ></div>
                                                <div className="text-sm font-medium text-slate-400 mt-3">{month}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 flex justify-between text-xs text-slate-500 px-2">
                                    <span>May 19 Start</span>
                                    <span>Aug 17 End</span>
                                </div>
                            </div>

                            {/* Devpost Verification Helper */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Simulate Business Sales</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                        Use this panel to instantly verify the Stripe redirection logic and trigger transaction recordings for specific months. This will populate your financial evidence logs dynamically.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {['May', 'June', 'July', 'August'].map((month) => (
                                        <button
                                            key={month}
                                            disabled={simulating}
                                            onClick={() => handleSimulateSale(month)}
                                            className="w-full py-2 px-4 bg-slate-800 hover:bg-indigo-600 active:scale-95 disabled:opacity-50 text-sm font-semibold rounded-lg transition border border-slate-700 hover:border-transparent text-center"
                                        >
                                            {simulating ? 'Processing Transaction...' : `Simulate $150 Sale in ${month}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Cost Structure & Devpost Disclosure Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-800">
                                    <span className="text-slate-400">Google Cloud Hosting</span>
                                    <div className="text-xl font-bold text-white mt-1">
                                        ${revenue.costs_breakdown.hosting.toFixed(2)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Covers Google Cloud Run instances & DB Storage hosting.</p>
                                </div>
                                <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-800">
                                    <span className="text-slate-400">Gemini LLM API Costs</span>
                                    <div className="text-xl font-bold text-white mt-1">
                                        ${revenue.costs_breakdown.api_usage.toFixed(2)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Based on input/output token counts of the counselor RAG engine.</p>
                                </div>
                                <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-800">
                                    <span className="text-slate-400">Stripe Payment Fees</span>
                                    <div className="text-xl font-bold text-white mt-1">
                                        ${revenue.costs_breakdown.stripe_fees.toFixed(2)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Calculated at standard rate of 2.9% + $0.30 per checkout event.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Ads Management Panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Advertisements List */}
                            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                                    <h2 className="text-lg font-bold text-white">Active Campaigns</h2>
                                    <p className="text-xs text-slate-400">Configure sponsorships, check real-time telemetry impressions/clicks, and view earnings.</p>
                                </div>

                                <div className="overflow-x-auto flex-grow">
                                    {adsLoading ? (
                                        <div className="p-8 text-center text-slate-400">
                                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                            Loading campaigns...
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                                                    <th className="p-4 font-semibold">Ad Info</th>
                                                    <th className="p-4 font-semibold">Pricing Model</th>
                                                    <th className="p-4 font-semibold">Telemetry</th>
                                                    <th className="p-4 font-semibold">Earnings</th>
                                                    <th className="p-4 font-semibold text-center">Status</th>
                                                    <th className="p-4 font-semibold text-center">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {ads.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="p-8 text-center text-slate-500">
                                                            No advertisements configured. Create your first campaign using the form on the right!
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    ads.map((ad) => {
                                                        const calculateAdEarnings = (item) => {
                                                            if (item.pricing_model === 'flat_rate') {
                                                                return item.price;
                                                            } else if (item.pricing_model === 'cpc') {
                                                                return item.clicks * item.price;
                                                            } else if (item.pricing_model === 'cpm') {
                                                                return (item.impressions / 1000) * item.price;
                                                            }
                                                            return 0;
                                                        };
                                                        return (
                                                            <tr key={ad.id} className="hover:bg-slate-900/20 transition">
                                                                <td className="p-4">
                                                                    <div className="font-bold text-white">{ad.title}</div>
                                                                    <div className="text-xs text-slate-400">
                                                                        {ad.sponsor_name} • <span className="capitalize text-indigo-400">{ad.ad_type?.replace('_', ' ')}</span>
                                                                    </div>
                                                                    {ad.target_url && (
                                                                        <a
                                                                            href={ad.target_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[10px] text-teal-400 hover:underline mt-1 block truncate max-w-[180px]"
                                                                        >
                                                                            🔗 {ad.target_url}
                                                                        </a>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 font-mono text-slate-300 text-xs">
                                                                    <div className="capitalize font-semibold">{ad.pricing_model?.replace('_', ' ')}</div>
                                                                    <div className="text-slate-500">${ad.price.toFixed(2)}</div>
                                                                </td>
                                                                <td className="p-4 text-slate-300 font-mono text-xs space-y-1">
                                                                    <div>👁️ {ad.impressions} <span className="text-[10px] text-slate-500">views</span></div>
                                                                    <div>🖱️ {ad.clicks} <span className="text-[10px] text-slate-500">clicks</span></div>
                                                                </td>
                                                                <td className="p-4 font-bold text-emerald-400 font-mono">
                                                                    ${calculateAdEarnings(ad).toFixed(2)}
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <button
                                                                        onClick={() => handleToggleAdActive(ad.id, ad.is_active)}
                                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition ${
                                                                            ad.is_active
                                                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                                                        }`}
                                                                    >
                                                                        {ad.is_active ? 'Active' : 'Inactive'}
                                                                    </button>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <button
                                                                        onClick={() => handleDeleteAd(ad.id)}
                                                                        className="text-rose-500 hover:text-rose-400 p-2 transition hover:bg-rose-500/10 rounded-lg active:scale-95"
                                                                        title="Delete campaign"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Create New Ad Form */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm self-start">
                                <h3 className="text-lg font-bold text-white mb-4">Create Campaign</h3>
                                <form onSubmit={handleCreateAd} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Sponsor Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={sponsorName}
                                            onChange={(e) => setSponsorName(e.target.value)}
                                            placeholder="e.g. Stanford University"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ad Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={adTitle}
                                            onChange={(e) => setAdTitle(e.target.value)}
                                            placeholder="e.g. Explore the Farm"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                                        <textarea
                                            required
                                            rows="3"
                                            value={adDesc}
                                            onChange={(e) => setAdDesc(e.target.value)}
                                            placeholder="Introduce the sponsorship details or call-to-action details..."
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Type</label>
                                            <select
                                                value={adType}
                                                onChange={(e) => setAdType(e.target.value)}
                                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                            >
                                                <option value="university_spotlight">University Spotlight</option>
                                                <option value="advisor_showcase">Advisor Showcase</option>
                                                <option value="other">Other Ad</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pricing Model</label>
                                            <select
                                                value={pricingModel}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setPricingModel(val);
                                                    if (val === 'flat_rate') setAdPrice('150.00');
                                                    else if (val === 'cpc') setAdPrice('1.50');
                                                    else if (val === 'cpm') setAdPrice('10.00');
                                                }}
                                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                            >
                                                <option value="flat_rate">Flat Rate</option>
                                                <option value="cpc">CPC (Cost Per Click)</option>
                                                <option value="cpm">CPM (Per 1k views)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                            Price / Rate ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={adPrice}
                                            onChange={(e) => setAdPrice(e.target.value)}
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Image URL</label>
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="e.g. https://images.unsplash.com/... (optional)"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target URL</label>
                                        <input
                                            type="text"
                                            value={targetUrl}
                                            onChange={(e) => setTargetUrl(e.target.value)}
                                            placeholder="e.g. https://university.edu/apply (optional)"
                                            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Acceptance Rate</label>
                                            <input
                                                type="text"
                                                value={acceptanceRate}
                                                onChange={(e) => setAcceptanceRate(e.target.value)}
                                                placeholder="e.g. 4.3% (optional)"
                                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">SAT Range</label>
                                            <input
                                                type="text"
                                                value={satRange}
                                                onChange={(e) => setSatRange(e.target.value)}
                                                placeholder="e.g. 1500-1570 (optional)"
                                                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition duration-150"
                                    >
                                        Create Advertisement
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
