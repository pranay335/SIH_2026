const API_URL = 'http://localhost:5000/api';

async function verify() {
    console.log('🧪 Starting Verification of Jurisdiction & Auto-Assignment');
    console.log('========================================================');

    try {
        // 1. Login as Citizen
        console.log('👤 Logging in as citizen...');
        const loginRes = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'user@civicmind.com',
                password: 'userpassword',
                role: 'user'
            })
        });

        if (!loginRes.ok) {
            const errText = await loginRes.text();
            throw new Error(`Login failed with status ${loginRes.status}: ${errText}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        const user = loginData.user;

        console.log(`✅ Logged in as: ${user.name} (${user.email})`);
        console.log(`📍 User Municipality: ${user.municipalityCode}`);

        // 2. Test Jurisdiction Failure (Trying to file in TMC if user is in BMC)
        // Thane coordinates: 19.2183, 72.9781
        console.log('\n🚫 Testing Jurisdiction Mismatch (TMC coordinates)...');
        const failRes = await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                complaint_id: `FAIL_TEST_${Date.now()}`,
                description: 'Testing jurisdiction mismatch',
                image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
                location: '19.2183, 72.9781', // Thane
                nlp_result: {
                    predicted_severity: 'Medium',
                    predicted_sector: 'Water Supply',
                    confidence: 0.9
                },
                cnn_result: {
                    predicted_class: 'leak',
                    confidence: 0.9
                },
                user_id: user.id
            })
        });

        if (failRes.status === 403) {
            const failData = await failRes.json();
            console.log('✅ Correctly blocked: ', failData.message);
        } else {
            console.error(`❌ Unexpected response status for mismatch test: ${failRes.status}`);
            const text = await failRes.text();
            console.log('Response body:', text);
        }

        // 3. Test Jurisdiction Success & Auto-Assignment (Filing in BMC if user is BMC)
        // Mumbai (BMC) coordinates: 19.0760, 72.8777
        console.log('\n✅ Testing Successful Filing & Auto-Assignment (BMC coordinates)...');
        const successRes = await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                complaint_id: `SUCCESS_TEST_${Date.now()}`,
                description: 'Pothole on BMC road',
                image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/AARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
                location: '19.0760, 72.8777', // BMC
                nlp_result: {
                    predicted_severity: 'High',
                    predicted_sector: 'Roads',
                    confidence: 0.95
                },
                cnn_result: {
                    predicted_class: 'pothole',
                    confidence: 0.92
                },
                user_id: user.id
            })
        });

        if (successRes.ok) {
            const successData = await successRes.json();
            console.log('✅ Complaint filed successfully!');
            const complaint = successData.complaint;
            console.log(`📍 Filed in: ${complaint.municipalityCode}`);
            console.log(`🏷️ Status: ${complaint.status}`);
            console.log(`👔 Assigned to ID: ${complaint.assigned_to || 'None'}`);
            console.log(`📝 Note: ${complaint.notes}`);

            if (complaint.status === 'Assigned' && complaint.assigned_to) {
                console.log('⭐⭐⭐ AUTO-ASSIGNMENT VERIFIED! ⭐⭐⭐');
            } else {
                console.warn('⚠️ Success, but no auto-assignment. Check if any employee is AVAILABLE in BMC Roads.');
            }
        } else {
            const errData = await successRes.json();
            console.error('❌ Filing failed:', errData.message);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verify();
