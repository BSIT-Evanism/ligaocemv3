# Database Seeders

This directory contains database seeding scripts for populating the application with sample data for development and testing.

## Request Seeder

The `seed-requests.ts` script populates the database with comprehensive sample data for the request management system.

### What it seeds:

- **Users**: 6 sample users (5 regular users + 1 admin)
- **Grave Clusters**: 3 cemetery sections with coordinates
- **Grave Details**: 3 sample grave plots with detailed information
- **Requests**: 50 sample requests with various statuses and dates
- **Request Statuses**: Status records for each request
- **Request Logs**: Multiple log entries per request with realistic messages

### Features:

- **Realistic Data**: Uses Filipino names, local phone numbers, and cemetery-appropriate content
- **Various Statuses**: Mix of pending, processing, approved, and rejected requests
- **Overdue Requests**: Some requests are marked as overdue (pending > 7 days)
- **Time Distribution**: Requests spread over the last 3 months
- **Priority Levels**: Random assignment of low, medium, high priorities
- **Contact Information**: Realistic phone numbers and contact preferences
- **Grave Relations**: Some requests are linked to specific grave plots

### Usage:

```bash
# Install dependencies first
npm install

# Run the seeder
npm run seed:requests

# Or run directly with tsx
npx tsx scripts/seed-requests.ts
```

### Prerequisites:

1. **Database Setup**: Ensure your database is set up and migrations are run
2. **Environment Variables**: Make sure `DATABASE_URL` is set in your `.env` file
3. **Dependencies**: Install the required packages with `npm install`

### Sample Data Generated:

#### Users:
- Maria Santos (maria.santos@example.com)
- Juan Dela Cruz (juan.delacruz@example.com)
- Ana Rodriguez (ana.rodriguez@example.com)
- Carlos Mendoza (carlos.mendoza@example.com)
- Elena Garcia (elena.garcia@example.com)
- Admin User (admin@ligaocemv3.com)

#### Request Types:
- Grave Maintenance Request
- New Grave Plot Application
- Grave Transfer Request
- Memorial Service Request
- Grave Decoration Request
- Grave Relocation Request
- Grave Documentation Request
- Grave Access Request

#### Status Distribution:
- ~25% Pending (some overdue)
- ~25% Processing
- ~25% Approved
- ~25% Rejected

### Safety Features:

- **Data Clearing**: Automatically clears existing data before seeding
- **Foreign Key Handling**: Properly handles database constraints
- **Error Handling**: Comprehensive error handling and logging
- **Transaction Safety**: Uses proper database transactions

### Customization:

You can modify the seeder script to:
- Change the number of requests generated
- Add more user types or roles
- Modify the date ranges
- Add more request types or statuses
- Customize the sample data content

### Troubleshooting:

1. **Database Connection Issues**: Verify your `DATABASE_URL` is correct
2. **Permission Errors**: Ensure your database user has INSERT/DELETE permissions
3. **Foreign Key Errors**: The script handles dependencies automatically
4. **Memory Issues**: For large datasets, consider reducing the number of requests

### Development Notes:

- The script uses realistic Filipino names and contexts
- Phone numbers follow the Philippine format (+63XXXXXXXXXX)
- Dates are distributed realistically over the past 3 months
- Request details are contextually appropriate for cemetery management
- Log messages are professional and realistic
