// ==========================================
// تنظیمات اتصال به دیتابیس Supabase
// ==========================================
const SUPABASE_URL = 'https://ducmehygksmijtynfuzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y21laHlna3NtaWp0eW5mdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTgyNTQsImV4cCI6MjA4MTIzNDI1NH0.Zo0RTm5fPn-sA6AkqSIPCCiehn8iW2Ou4I26HnC2CfU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. خروج از حساب (Logout) ---
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
    // 2. تغییر رمز خود مدیر (Admin Password Update)
    // ============================================
    const adminPassInput = document.getElementById('admin-new-pass');
    const updateAdminBtn = document.getElementById('update-admin-btn');
    const adminError = document.getElementById('admin-error');
    const adminSuccess = document.getElementById('admin-success');

    if (updateAdminBtn) {
        updateAdminBtn.addEventListener('click', async () => {
            const newPass = adminPassInput.value.trim();
            adminError.style.display = 'none';
            adminSuccess.style.display = 'none';

            // اعتبارسنجی رمز عبور (Validation)
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(newPass)) {
                adminError.innerText = "Password must include 1 Uppercase, 1 Lowercase, and 1 Number.";
                adminError.style.display = 'block';
                return;
            }

            updateAdminBtn.innerText = "Updating...";
            updateAdminBtn.disabled = true;

            try {
                // استفاده از RPC (تابع دیتابیس) برای عبور از RLS
                const { error } = await supabaseClient.rpc('update_admin_password', {
                    new_password: newPass,
                    target_user: 'admin' // نام کاربری مدیر
                });

                if (error) throw error;

                adminSuccess.style.display = 'block';
                adminPassInput.value = '';

            } catch (err) {
                console.error("Update Error:", err);
                // اگر ارور مربوط به نبود تابع باشد (چون هنوز در SQL نساختید)
                if (err.message.includes('function') && err.message.includes('does not exist')) {
                    adminError.innerText = "Error: Please create 'update_admin_password' function in Supabase SQL Editor.";
                } else {
                    adminError.innerText = "Update Failed: " + err.message;
                }
                adminError.style.display = 'block';
            } finally {
                updateAdminBtn.innerText = "Update My Password";
                updateAdminBtn.disabled = false;
            }
        });
    }

    // ============================================
    // 3. مدیریت کارمندان (Staff Management)
    // ============================================
    const userInput = document.getElementById('new-user');
    const passInput = document.getElementById('new-pass');
    const createBtn = document.getElementById('create-btn');
    const userError = document.getElementById('user-error');
    const passError = document.getElementById('pass-error');
    const staffSuccess = document.getElementById('staff-success');

    // بارگذاری اولیه لیست
    loadStaffList();

    // --- ساخت کارمند جدید ---
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const username = userInput.value.trim();
            const password = passInput.value.trim();
            
            userError.style.display = 'none';
            passError.style.display = 'none';
            staffSuccess.style.display = 'none';
            let isValid = true;

            // الف) اعتبارسنجی نام کاربری
            if (!/^[a-zA-Z0-9]+$/.test(username)) {
                userError.innerText = "Username: Only English letters and numbers allowed.";
                userError.style.display = 'block';
                isValid = false;
            }
            // ب) اعتبارسنجی رمز عبور
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(password)) {
                passError.innerText = "Password: Must have 1 Uppercase, 1 Lowercase, 1 Number.";
                passError.style.display = 'block';
                isValid = false;
            }

            if (isValid) {
                createBtn.innerText = "Saving...";
                createBtn.disabled = true;

                try {
                    // 1. چک کردن تکراری نبودن (نیاز به Policy خواندن دارد)
                    const { data: existing } = await supabaseClient
                        .from('staff')
                        .select('username')
                        .eq('username', username);
                    
                    if (existing && existing.length > 0) {
                        userError.innerText = "Username already exists.";
                        userError.style.display = 'block';
                        createBtn.innerText = "Create Account";
                        createBtn.disabled = false;
                        return;
                    }

                    // 2. ساخت کارمند
                    const { error } = await supabaseClient
                        .from('staff')
                        .insert([{ username: username, password: password }]);

                    if (error) throw error;
                    
                    staffSuccess.style.display = 'block';
                    userInput.value = '';
                    passInput.value = '';
                    loadStaffList(); // رفرش لیست

                } catch (err) {
                    console.error("Create Staff Error:", err);
                    alert("Error creating staff: " + err.message + "\n(Check RLS Policies for 'staff' table)");
                } finally {
                    createBtn.innerText = "Create Account";
                    createBtn.disabled = false;
                }
            }
        });
    }

    // --- تابع بارگذاری لیست کارمندان ---
    async function loadStaffList() {
        const container = document.getElementById('staff-container');
        if (!container) return;
        
        // دریافت لیست (نیاز است که برای جدول staff سیاست Public Read تنظیم کرده باشید)
        const { data, error } = await supabaseClient
            .from('staff')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error("Load List Error:", error);
            // اگر خطای RLS باشد، پیام مناسب می‌دهیم
            container.innerHTML = '<p style="color:red; font-size:12px;">Access Denied (RLS is on). Add "Select" Policy for Staff.</p>';
            return;
        }

        container.innerHTML = '';
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#aaa">No staff found.</p>';
            return;
        }

        data.forEach(user => {
            const div = document.createElement('div');
            div.className = 'staff-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:35px; height:35px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                        <i class="ri-user-line"></i>
                    </div>
                    <span style="font-weight:500;">${user.username}</span>
                </div>
                <div class="staff-actions">
                    <button class="btn-action btn-reset" onclick="resetPassword(${user.id}, '${user.username}')">
                        <i class="ri-key-2-line"></i> New Pass
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteUser(${user.id})">
                        <i class="ri-delete-bin-line"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // --- تابع تغییر رمز کارمند (Global) ---
    window.resetPassword = async function(id, username) {
        const newPass = prompt(`Enter NEW password for ${username}:`);
        
        if (newPass) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]+$/;
            if (!passRegex.test(newPass)) {
                alert("Error: Password must include 1 Uppercase, 1 Lowercase, and 1 Number.");
                return;
            }

            const { error } = await supabaseClient
                .from('staff')
                .update({ password: newPass })
                .eq('id', id);

            if (error) {
                alert("Error updating: " + error.message + "\n(Check RLS Policies)");
            } else {
                alert(`Password for ${username} updated successfully!`);
            }
        }
    }

    // --- تابع حذف کارمند (Global) ---
    window.deleteUser = async function(id) {
        if(confirm('Are you sure you want to remove this user?')) {
            const { error } = await supabaseClient
                .from('staff')
                .delete()
                .eq('id', id);
                
            if (error) {
                alert("Error deleting: " + error.message + "\n(Check RLS Policies)");
            } else {
                loadStaffList();
            }
        }
    }
});
