# Manual Testing Guide - Shift Timeline Refactor

## Prerequisites
- Server running: `npm start` (port 5000)
- Client running: `npm run client` (port 3000)
- **Postman** or **curl** installed
- Admin user logged in and token ready

---

## **PART 1: Get Your Admin Token**

### Login to Admin Account
**URL**: `POST http://localhost:5000/api/auth/staff-login`

**Body**:
```json
{
  "identifier": "admin_username",
  "password": "admin_password"
}
```

**Response** (save this token):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin_user_id",
    "name": "Admin Name",
    "role": "Admin"
  }
}
```

**For all following requests**: Add header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## **PART 2: Create Shift Templates**

### Request 1: Create Morning Shift
**URL**: `POST http://localhost:5000/api/admin/shift-templates`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Body**:
```json
{
  "name": "Morning",
  "startTime": "08:00",
  "endTime": "16:00"
}
```

**Expected Response**:
```json
{
  "message": "Shift template created successfully",
  "shiftTemplate": {
    "_id": "COPY_THIS_ID",
    "name": "Morning",
    "startTime": "08:00",
    "endTime": "16:00",
    "isActive": true,
    "createdAt": "2025-01-08T16:40:00Z"
  }
}
```

✅ **Save**: `MORNING_SHIFT_ID` = the `_id` value

---

### Request 2: Create Evening Shift
**URL**: `POST http://localhost:5000/api/admin/shift-templates`

**Body**:
```json
{
  "name": "Evening",
  "startTime": "16:00",
  "endTime": "00:00"
}
```

✅ **Save**: `EVENING_SHIFT_ID` = the `_id` value

---

### Request 3: Create Night Shift
**URL**: `POST http://localhost:5000/api/admin/shift-templates`

**Body**:
```json
{
  "name": "Night",
  "startTime": "00:00",
  "endTime": "08:00"
}
```

✅ **Save**: `NIGHT_SHIFT_ID` = the `_id` value

---

### Request 4: Verify All Shifts Created
**URL**: `GET http://localhost:5000/api/admin/shift-templates`

**Expected Response** (3 shifts):
```json
{
  "shiftTemplates": [
    {
      "_id": "...",
      "name": "Evening",
      "startTime": "16:00",
      "endTime": "00:00",
      "isActive": true
    },
    {
      "_id": "...",
      "name": "Morning",
      "startTime": "08:00",
      "endTime": "16:00",
      "isActive": true
    },
    {
      "_id": "...",
      "name": "Night",
      "startTime": "00:00",
      "endTime": "08:00",
      "isActive": true
    }
  ]
}
```

✅ **Test Passed**: All 3 shift templates created

---

## **PART 3: Get Staff IDs**

You need staff IDs to create mappings. Get them from your User collection.

### Option A: Check Database Directly
```bash
# In MongoDB shell or Atlas:
db.users.find({ role: { $in: ['Lab Technician', 'Pharmacist'] } }).pretty()
```

### Option B: List Staff from Admin Panel
Frontend: Admin Dashboard → Staff Management → Find Lab Technician & Pharmacist users

✅ **Save**: 
- `LAB_TECH_USER_ID` (e.g., "507f1f77bcf86cd799439011")
- `PHARMACIST_USER_ID`
- Their names

---

## **PART 4: Create Staff-Shift Mappings**

### Request 1: Map Lab Technician to Morning Shift
**URL**: `POST http://localhost:5000/api/admin/staff-shift-mappings`

**Body**:
```json
{
  "staffId": "LAB_TECH_USER_ID",
  "staffName": "John Lab Tech",
  "role": "Lab Technician",
  "shiftTemplateId": "MORNING_SHIFT_ID",
  "effectiveFrom": "2025-01-01T00:00:00Z"
}
```

**Expected Response**:
```json
{
  "message": "Staff shift mapping created successfully",
  "mapping": {
    "_id": "mapping_id_1",
    "staffId": "...",
    "staffName": "John Lab Tech",
    "role": "Lab Technician",
    "shiftTemplateId": "MORNING_SHIFT_ID",
    "effectiveFrom": "2025-01-01T00:00:00Z",
    "effectiveTo": null,
    "isActive": true
  }
}
```

✅ **Test Passed**: Lab Tech mapped to Morning shift

---

### Request 2: Map Pharmacist to Evening Shift
**URL**: `POST http://localhost:5000/api/admin/staff-shift-mappings`

**Body**:
```json
{
  "staffId": "PHARMACIST_USER_ID",
  "staffName": "Sarah Pharmacist",
  "role": "Pharmacist",
  "shiftTemplateId": "EVENING_SHIFT_ID",
  "effectiveFrom": "2025-01-01T00:00:00Z"
}
```

✅ **Test Passed**: Pharmacist mapped to Evening shift

---

### Request 3: Verify All Mappings
**URL**: `GET http://localhost:5000/api/admin/staff-shift-mappings`

**Expected Response**:
```json
{
  "mappings": [
    {
      "_id": "...",
      "staffId": {
        "_id": "...",
        "name": "John Lab Tech"
      },
      "staffName": "John Lab Tech",
      "role": "Lab Technician",
      "shiftTemplateId": {
        "_id": "MORNING_SHIFT_ID",
        "name": "Morning",
        "startTime": "08:00",
        "endTime": "16:00"
      },
      "isActive": true
    },
    {
      "_id": "...",
      "staffId": {
        "_id": "...",
        "name": "Sarah Pharmacist"
      },
      "staffName": "Sarah Pharmacist",
      "role": "Pharmacist",
      "shiftTemplateId": {
        "_id": "EVENING_SHIFT_ID",
        "name": "Evening",
        "startTime": "16:00",
        "endTime": "00:00"
      },
      "isActive": true
    }
  ]
}
```

✅ **Test Passed**: Staff-shift mappings created

---

## **PART 5: Test Task Assignment (Core Test)**

### Get Doctor Token
**URL**: `POST http://localhost:5000/api/auth/staff-login`

**Body**:
```json
{
  "identifier": "doctor_username",
  "password": "doctor_password"
}
```

✅ **Save**: `DOCTOR_TOKEN`

---

### Get a Visit ID
**Option 1**: From recent visit in database
```bash
# MongoDB:
db.visits.findOne().pretty()
# Copy the _id value
```

**Option 2**: Create new visit via Reception → Register Patient

✅ **Save**: `VISIT_ID`

---

### Test 1: Create Lab Test Task (During Morning Hours)

⏰ **Important**: Current time should be between **08:00 - 16:00** (Morning shift active)

**Check Current Time**: 
```bash
# In browser console:
console.log(new Date().toLocaleTimeString())
```

**URL**: `POST http://localhost:5000/api/tasks`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer DOCTOR_TOKEN
```

**Body**:
```json
{
  "taskType": "Lab Test",
  "description": "Complete Blood Count (CBC) for patient",
  "relatedVisitId": "VISIT_ID"
}
```

**Expected Response** ✅:
```json
{
  "message": "Task created and assigned successfully",
  "task": {
    "_id": "task_id_1",
    "taskType": "Lab Test",
    "description": "Complete Blood Count (CBC) for patient",
    "assignedTo": "LAB_TECH_USER_ID",
    "staffName": "John Lab Tech",
    "role": "Lab Technician",
    "status": "Pending",
    "relatedVisitId": "VISIT_ID",
    "createdAt": "2025-01-08T10:30:00Z"
  }
}
```

✅ **Test Passed**: Task assigned to Lab Tech (who is on Morning shift)

---

### Test 2: Create Pharmacy Task (During Evening Hours)

⏰ **Timing**: Set your system clock to **17:00** (5 PM) or later for Evening shift

**OR**: Just create the task and verify it gets correct role

**URL**: `POST http://localhost:5000/api/tasks`

**Body**:
```json
{
  "taskType": "Pharmacy",
  "description": "Prepare medication pack for patient ABC",
  "relatedVisitId": "VISIT_ID"
}
```

**If time is 16:00-00:00 (Evening shift)** ✅:
```json
{
  "message": "Task created and assigned successfully",
  "task": {
    "assignedTo": "PHARMACIST_USER_ID",
    "staffName": "Sarah Pharmacist",
    "role": "Pharmacist",
    "status": "Pending"
  }
}
```

**If time is NOT during Evening shift** (Shift not active):
```json
{
  "message": "Task created but no staff available for assignment",
  "task": {
    "assignedTo": null,
    "staffName": "Unassigned",
    "role": "Pharmacist",
    "status": "Pending - No Staff Available"
  }
}
```

✅ **Test Passed**: Task creation handles off-shift hours

---

## **PART 6: Verify Task Load Distribution**

### Create 3 Lab Test Tasks (Quickly)
Repeat this 3 times:

**URL**: `POST http://localhost:5000/api/tasks`

**Body** (change description each time):
```json
{
  "taskType": "Lab Test",
  "description": "Test 1 - Blood test",
  "relatedVisitId": "VISIT_ID"
}
```

All should assign to same Lab Tech (John) since only one is on Morning shift.

---

### Get Lab Technician's Tasks
**URL**: `GET http://localhost:5000/api/tasks/staff/LAB_TECH_USER_ID`

**Expected Response** ✅:
```json
{
  "tasks": [
    {
      "_id": "...",
      "taskType": "Lab Test",
      "description": "Test 3 - Lab test",
      "assignedTo": "LAB_TECH_USER_ID",
      "staffName": "John Lab Tech",
      "status": "Pending",
      "createdAt": "2025-01-08T10:35:00Z"
    },
    {
      "_id": "...",
      "taskType": "Lab Test",
      "description": "Test 2 - Blood test",
      "assignedTo": "LAB_TECH_USER_ID",
      "staffName": "John Lab Tech",
      "status": "Pending",
      "createdAt": "2025-01-08T10:34:00Z"
    },
    {
      "_id": "...",
      "taskType": "Lab Test",
      "description": "Test 1 - Blood test",
      "assignedTo": "LAB_TECH_USER_ID",
      "staffName": "John Lab Tech",
      "status": "Pending",
      "createdAt": "2025-01-08T10:33:00Z"
    }
  ]
}
```

✅ **Test Passed**: Staff has multiple assigned tasks

---

## **PART 7: Test Dashboard Still Works**

### Lab Dashboard
1. **URL**: `http://localhost:3000/lab` (or your Lab Dashboard route)
2. **Login**: As Lab Technician
3. **Verify**:
   - ✅ Pending lab tests show
   - ✅ Tasks assigned to you display
   - ✅ Can update task status

### Pharmacy Dashboard
1. **URL**: `http://localhost:3000/pharmacy` (or your Pharmacy route)
2. **Login**: As Pharmacist
3. **Verify**:
   - ✅ Pending prescriptions show
   - ✅ Can dispense medicines
   - ✅ No shift-related issues

---

## **PART 8: Test Midnight-Crossing Shift**

### Scenario: Night Shift (00:00 - 08:00)

**Setup**: 
- Create a Lab Tech assignment to Night shift
- Assign Night shift Lab Tech to Night template

**Test 1: At 02:00 AM**
- Create Lab Test task
- Should assign to Night shift Lab Tech

**Test 2: At 10:00 AM**
- Create Lab Test task
- Should show "No Staff Available" (no Morning Lab Tech exists in test)

---

## **PART 9: Test Staff Role Normalization**

Lab Technicians can have role: `Lab` or `Lab Technician`

**Test**: Create mapping with role `Lab`
```json
{
  "staffId": "LAB_TECH_USER_ID",
  "staffName": "Jane Lab",
  "role": "Lab",
  "shiftTemplateId": "MORNING_SHIFT_ID",
  "effectiveFrom": "2025-01-01T00:00:00Z"
}
```

**Expected**: Lab tests should still assign to this staff

✅ **Test Passed**: Role normalization works

---

## **PART 10: Test Edit/Update Mappings**

### Update Lab Tech's Shift
**URL**: `PUT http://localhost:5000/api/admin/staff-shift-mappings/MAPPING_ID`

**Body**:
```json
{
  "shiftTemplateId": "EVENING_SHIFT_ID"
}
```

**Expected Response** ✅:
```json
{
  "message": "Staff shift mapping updated successfully",
  "mapping": {
    "shiftTemplateId": {
      "_id": "EVENING_SHIFT_ID",
      "name": "Evening",
      "startTime": "16:00",
      "endTime": "00:00"
    }
  }
}
```

✅ **Test Passed**: Mapping updated

---

## **FINAL CHECKLIST** ✅

- [ ] Created 3 shift templates (Morning, Evening, Night)
- [ ] Created 2+ staff-shift mappings
- [ ] Lab Test task assigned during active shift
- [ ] Pharmacy task created during active shift
- [ ] "No Staff Available" task created during inactive shift
- [ ] Lab Dashboard still shows pending tests
- [ ] Pharmacy Dashboard still shows pending prescriptions
- [ ] Staff task load displays correctly
- [ ] Can update task status
- [ ] Midnight-crossing shift tested
- [ ] Role normalization tested (Lab vs Lab Technician)
- [ ] Edit/Update mapping tested

---

## **Troubleshooting**

**Issue**: "No Staff Available" always showing
- **Fix**: Check if current time is within shift hours (08:00-16:00 for Morning)
- **Fix**: Verify staff mapping `effectiveFrom` is before current date
- **Fix**: Check `isActive: true` for both template and mapping

**Issue**: Task not assigned to correct staff
- **Fix**: Verify system time matches expected shift
- **Fix**: Check staff role matches task type (Lab Technician for Lab Test, Pharmacist for Pharmacy)

**Issue**: Dashboard not showing tasks
- **Fix**: Tasks still work - this is expected (no UI changes required)
- **Fix**: Check browser console for errors

**Issue**: Authorization error
- **Fix**: Verify token in Authorization header
- **Fix**: Token format: `Bearer YOUR_TOKEN`
