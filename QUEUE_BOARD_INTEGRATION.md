# Digital Queue Board - Complete Integration Guide

## Overview
The Digital Queue Board module is a comprehensive system for managing doctor-specific patient queues based on shift and visit status. The system follows a strict FIFO (First-In-First-Out) token-based approach with automatic shift validation.

---

## System Architecture

### Data Flow
```
Patient Registered (open)
    ↓
Nurse Records Vitals
    ↓
Nurse Marks Patient "Ready"
    ↓ [POST /api/queue/visit/:visitId/ready]
    ↓
Visit Status → ReadyForConsultation
    ↓
Patient Enters Doctor's Queue
    ↓
Doctor Clicks "Call Next" (Queue Board)
    ↓ [POST /api/queue/doctor/me/next]
    ↓
Next Patient Status → InConsultation
    ↓
Previous Patient Status → Completed
```

---

## Implementation Files

### Backend Implementation

#### 1. **Visit Model** (`server/models/Visit.js`)
Enhanced with new status values for queue management:
```javascript
status: { 
  type: String, 
  enum: [
    'open',                      // Original status
    'closed',                     // Original status
    'cancelled',                  // Original status
    'no-show',                    // Original status
    'ReadyForConsultation',       // NEW: Patient ready for doctor
    'InConsultation',             // NEW: Currently with doctor
    'Completed'                   // NEW: Consultation finished
  ],
  default: 'open' 
}
```

**Backward Compatibility:** Old visits with `open`, `closed`, `cancelled`, `no-show` statuses continue to work.

#### 2. **Queue API Route** (`server/routes/queue.js`)
Three core endpoints for queue management:

##### Endpoint 1: Get Doctor's Queue
```
GET /api/queue/doctor/me
GET /api/queue/doctor/:doctorId

Authentication: Doctor role required
Response:
{
  "doctor": { "id": "...", "name": "Dr. John Doe" },
  "currentToken": {
    "visitId": "...",
    "tokenNumber": 5,
    "patientName": "John Smith",
    "opNumber": "25-1062"
  },
  "nextTokens": [
    { "visitId": "...", "tokenNumber": 6, "patientName": "Jane Doe", "opNumber": "25-1063" },
    { "visitId": "...", "tokenNumber": 7, "patientName": "Bob Wilson", "opNumber": "25-1064" }
  ],
  "waitingCount": 2
}
```

**Shift Validation:** Returns error if doctor is off-shift
```json
{
  "message": "Doctor is not on active shift",
  "currentToken": null,
  "nextTokens": [],
  "waitingCount": 0
}
```

##### Endpoint 2: Call Next Patient
```
POST /api/queue/doctor/me/next
POST /api/queue/doctor/:doctorId/next

Authentication: Doctor role required
Logic:
1. Find current InConsultation visit → Mark as Completed
2. Find next ReadyForConsultation visit → Mark as InConsultation
3. Return updated queue state

Response: Updated queue state (same format as GET)
```

##### Endpoint 3: Mark Patient Ready
```
POST /api/queue/visit/:visitId/ready

Authentication: Nurse or Admin required
Logic:
1. Validate doctor is on active shift
2. Mark visit status as ReadyForConsultation
3. Patient automatically added to doctor's queue

Response:
{
  "message": "Visit marked as ready for consultation",
  "visit": {
    "_id": "...",
    "tokenNumber": 5,
    "status": "ReadyForConsultation"
  }
}
```

#### 3. **Shift Validation Logic**
Uses existing `shiftResolver.js` utility:
- Gets active shift template using current system time
- Validates doctor is mapped to active shift with valid date range
- Prevents queue operations if doctor is off-shift

---

### Frontend Implementation

#### 1. **Nurse Dashboard** (`meditrack-client/src/pages/NurseDashboard.jsx`)

**New Features:**
- "Mark Ready" button in Actions column
- Only visible when:
  - Vitals have been recorded
  - Visit status is 'open'
- Success/error messages with color-coded alerts

**UI Changes:**
```jsx
<Button
  size="small"
  variant="contained"
  color="success"
  startIcon={<PlayArrowIcon />}
  onClick={() => handleMarkReady(v._id)}
  disabled={markingReady === v._id}
>
  {markingReady === v._id ? 'Ready...' : 'Ready'}
</Button>
```

**Handler:**
```javascript
const handleMarkReady = async (visitId) => {
  try {
    await api.post(`/queue/visit/${visitId}/ready`);
    setMessageType("success");
    setMessage("Patient marked as ready for consultation");
    loadVisits();
  } catch (e) {
    setMessageType("error");
    setMessage(e.response?.data?.message);
  }
};
```

#### 2. **Doctor Queue Board** (`meditrack-client/src/pages/DoctorQueueBoard.jsx`)

**Standalone Queue Management Component**
- Large, TV-display friendly interface
- Current token shown in massive font (120px)
- Waiting queue list (up to 5 patients visible)
- Auto-refresh every 5 seconds

**Features:**
- Current patient in consultation (large display)
- Next 5 waiting patients in queue
- Waiting count badge
- "Call Next" button (prominent green)
- Doctor info in header
- Logout button
- Disabled UI when doctor is off-shift

**Sample UI:**
```
┌─────────────────────────────────────────┐
│ Dr. John Doe                    LOGOUT  │
├──────────────────┬──────────────────────┤
│ CURRENT TOKEN    │ WAITING QUEUE        │
│                  │ 2 patients waiting   │
│       5          │                      │
│                  │ Token 6: John Smith  │
│ John Smith       │ Token 7: Jane Doe    │
│ OP: 25-1062      │                      │
│                  │ [CALL NEXT]          │
└──────────────────┴──────────────────────┘
```

#### 3. **Doctor Dashboard** (`meditrack-client/src/pages/DoctorDashboard.jsx`)

**Navigation Update:**
- Added "Queue Board" menu item in sidebar
- Navigates to `/doctor-queue-board`
- Icon: QueueMusicIcon
- Positioned after Dashboard in menu

```jsx
<ListItemButton onClick={() => navigate('/doctor-queue-board')}>
  <ListItemIcon sx={{ color: "#fff" }}>
    <QueueMusicIcon />
  </ListItemIcon>
  <ListItemText primary="Queue Board" />
</ListItemButton>
```

#### 4. **App Routing** (`meditrack-client/src/App.js`)

**New Route:**
```jsx
<Route path="/doctor-queue-board" element={<DoctorQueueBoard />} />
```

---

## API Endpoints Summary

| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/api/queue/doctor/me` | GET | Doctor | Get current queue state |
| `/api/queue/doctor/:doctorId` | GET | Doctor | Get doctor's queue (by ID) |
| `/api/queue/doctor/me/next` | POST | Doctor | Call next patient |
| `/api/queue/doctor/:doctorId/next` | POST | Doctor | Call next patient (by ID) |
| `/api/queue/visit/:visitId/ready` | POST | Nurse, Admin | Mark patient ready for consultation |

---

## Workflow Examples

### Example 1: Complete Patient Consultation Flow

**Timeline:**
```
09:00 - Patient "John Smith" arrives (Token #1)
        Reception creates visit → status: "open"

09:05 - Nurse calls patient to vitals booth
        Nurse records: BP 120/80, Temp 98.6F, Oxygen 98%, Weight 65kg
        Click "Save Vitals" button

09:10 - Nurse clicks "Mark Ready" button
        API call: POST /api/queue/visit/{visitId}/ready
        Visit status → "ReadyForConsultation"
        John added to doctor's queue

09:12 - Doctor opens Queue Board (/doctor-queue-board)
        Sees: Current: None | Next: [#1 John Smith, #2 Jane Doe, ...]

09:15 - Doctor clicks "CALL NEXT"
        API call: POST /api/queue/doctor/me/next
        John's status → "InConsultation"
        Queue Board updates: Current: #1 John | Next: [#2 Jane, #3 Bob]

09:45 - Doctor finishes consultation
        Clicks "CALL NEXT" again
        John's status → "Completed"
        Jane's status → "InConsultation"
```

### Example 2: Off-Shift Doctor

**Scenario:** Doctor tries to access queue while off-shift
```
Doctor navigates to /doctor-queue-board
System detects: Current time (14:00) is outside shift window (09:00-12:00)
Queue Board shows:
  ❌ "You are not on active shift. Queue is unavailable."
  Current: None | Next: [] | Waiting: 0
  "Call Next" button: DISABLED
```

---

## Testing Checklist

### Prerequisite Setup
- [ ] MongoDB running and connected
- [ ] Shift template created (e.g., "Morning" 09:00-12:00)
- [ ] Doctor created in system
- [ ] Doctor mapped to active shift template
- [ ] Test patient created with phone number

### Nurse Dashboard Tests
- [ ] Vitals button opens dialog
- [ ] Can record vitals: BP, Temperature, Oxygen, Weight
- [ ] "Mark Ready" button appears only after vitals recorded
- [ ] "Mark Ready" button disabled while processing
- [ ] Success message shows after marking ready
- [ ] Visit list refreshes after marking ready

### Queue Board Tests
- [ ] Doctor can navigate to queue board via menu
- [ ] Queue board shows doctor's name
- [ ] Queue board displays current token (when one exists)
- [ ] Queue board displays waiting list (up to 5 patients)
- [ ] Waiting count matches actual queue size
- [ ] Auto-refresh updates every 5 seconds
- [ ] "Call Next" button calls next patient
- [ ] Token advances after calling next
- [ ] Off-shift warning appears when doctor is not on active shift
- [ ] UI disabled when off-shift
- [ ] "Call Next" button disabled when no patients waiting

### Shift Validation Tests
- [ ] Queue unavailable outside shift hours
- [ ] Queue available during shift hours
- [ ] Nurse can't mark ready if doctor is off-shift
- [ ] Doctor can't call next if off-shift

### End-to-End Workflow
- [ ] Create visit with registration
- [ ] Nurse marks patient ready
- [ ] Patient appears in doctor's queue
- [ ] Doctor calls next patient
- [ ] Patient moves from queue to current
- [ ] Previous patient marked complete
- [ ] Doctor calls next again
- [ ] Next patient moves to current
- [ ] Queue properly ordered by token number

---

## Database Queries for Testing

### Check Queue State
```javascript
// Get all ready patients for a doctor
db.visits.find({ 
  doctorId: ObjectId("..."), 
  status: "ReadyForConsultation" 
}).sort({ tokenNumber: 1 })

// Get current consultation
db.visits.findOne({ 
  doctorId: ObjectId("..."), 
  status: "InConsultation" 
})

// Get completed visits
db.visits.find({ 
  doctorId: ObjectId("..."), 
  status: "Completed" 
}).limit(5)
```

### Check Shift Mapping
```javascript
db.staffshiftmappings.findOne({
  staffId: ObjectId("..."),
  role: "Doctor",
  isActive: true
}).populate("shiftTemplateId")
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Doctor profile not found" | Doctor user not properly linked | Ensure Staff User has Doctor profile |
| "Doctor is not on active shift" | Outside shift hours or no mapping | Create shift mapping during active shift hours |
| "Visit not found" | Invalid visit ID | Verify visit ID exists in database |
| "Failed to mark visit as ready" | Doctor off-shift | Doctor must be on active shift |
| Queue not updating | Auto-refresh disabled or network issue | Check browser console, refresh manually |

---

## Performance Considerations

- **Auto-refresh interval:** 5 seconds (configurable in DoctorQueueBoard)
- **Queue limit:** Shows first 5 patients in UI (database unlimited)
- **Database queries:** Indexed on `doctorId` and `status` fields
- **Shift validation:** Uses in-memory shift template (cached)

---

## Future Enhancements

1. **Queue Board Customization**
   - Adjustable font sizes
   - Custom color themes
   - Display multiple doctors (split view)

2. **Queue Analytics**
   - Average wait time
   - Patient throughput metrics
   - Peak hours analysis

3. **Patient Notifications**
   - SMS when called
   - WhatsApp queue position updates
   - Estimated wait time

4. **Advanced Queue Management**
   - Priority patients (VIP, urgent)
   - Walk-in patients
   - Queue pause/resume
   - Patient skip/defer options

---

## Support & Troubleshooting

For issues:
1. Check browser console for API errors
2. Verify shift template is active and in time range
3. Ensure doctor is mapped to shift template
4. Check MongoDB connection in backend logs
5. Review API response status codes and messages

---

**Last Updated:** January 2026  
**Status:** Production Ready ✅
