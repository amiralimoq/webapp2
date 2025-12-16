// ==========================================
// تنظیمات اتصال به دیتابیس Supabase
// ==========================================
const SUPABASE_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. مدیریت ناوبری سایدبار (Sidebar Navigation) ---
    const menuItems = document.querySelectorAll('.menu-item:not(.logout)');
    const sections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // آپدیت کلاس اکتیو منو
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // نمایش سکشن مربوطه
            const targetId = item.getAttribute('data-target');
            sections.forEach(sec => sec.classList.remove('active-section'));
            document.getElementById(targetId).classList.add('active-section');

            // بارگذاری دیتا بر اساس تب
            if(targetId === 'dashboard') loadMonthStats();
            if(targetId === 'customer-club') loadAllCustomers(); // پیشفرض همه مشتریان
            if(targetId === 'messages') loadMessages();
        });
    });

    // --- خروج (Logout) ---
    const logoutBtn = document.querySelector('.logout');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // ============================================
    // A. داشبورد: آمار ماهانه (Current Month Stats)
    // ============================================
    async function loadMonthStats() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // کوئری گرفتن سفارشات ماه جاری که Completed هستند
        const { data, error } = await supabaseClient
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed')
            .gte('created_at', firstDay)
            .lte('created_at', lastDay);

        if (!error 
