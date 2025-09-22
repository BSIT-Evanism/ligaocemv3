# User Management Implementation

This document describes the user management system implemented using Better Auth's Admin plugin with a modern data table interface.

## Features Implemented

### 1. User Data Table (`src/components/user-data-table.tsx`)
- **TanStack Table Integration**: Full-featured data table with sorting, filtering, and pagination
- **Search Functionality**: Real-time search across user names and emails
- **Column Management**: Show/hide columns as needed
- **User Actions**: Context menu with actions for each user
- **Responsive Design**: Mobile-friendly table layout

### 2. User Management Hook (`src/hooks/use-users.ts`)
- **CRUD Operations**: Create, read, update, delete users
- **Role Management**: Change user roles (admin/user)
- **Ban/Unban**: Ban users with reason and expiration
- **Password Management**: Update user passwords
- **Error Handling**: Comprehensive error handling and user feedback

### 3. User Management Dialog (`src/components/user-management-dialog.tsx`)
- **Create Users**: Add new users with email, password, name, and role
- **Edit Users**: Update existing user information
- **Form Validation**: Client-side validation for required fields
- **Role Selection**: Dropdown for selecting user roles

### 4. Users Page (`src/app/dashboard/users/page.tsx`)
- **Complete Interface**: Full user management interface
- **Action Handlers**: Handle all user management actions
- **Error Display**: Show errors and success messages
- **Loading States**: Proper loading indicators

## Available Actions

### User Actions
- **Create User**: Add new users to the system
- **Edit User**: Update user information (name, email, password, role)
- **Ban User**: Ban users with optional reason
- **Unban User**: Remove ban from users
- **Delete User**: Permanently remove users
- **Change Role**: Switch between user and admin roles
- **Copy User ID**: Copy user ID to clipboard

### Table Features
- **Search**: Search by name or email
- **Sort**: Sort by any column
- **Filter**: Filter by role, status, etc.
- **Pagination**: Navigate through large user lists
- **Column Visibility**: Show/hide columns
- **Row Selection**: Select multiple users for bulk actions

## Better Auth Integration

The implementation uses Better Auth's Admin plugin with the following features:

### Server-side Configuration
```typescript
// src/server/auth.ts
import { admin } from "better-auth/plugins"

export const auth = betterAuth({
  plugins: [admin()]
})
```

### Client-side Configuration
```typescript
// src/lib/auth-client.ts
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [adminClient()]
})
```

### Available API Methods
- `authClient.admin.createUser()`
- `authClient.admin.listUsers()`
- `authClient.admin.banUser()`
- `authClient.admin.unbanUser()`
- `authClient.admin.removeUser()`
- `authClient.admin.setRole()`
- `authClient.admin.setUserPassword()`

## Database Schema

The Admin plugin adds the following fields to the user table:

- `role`: User role (admin/user)
- `banned`: Boolean indicating if user is banned
- `banReason`: Reason for the ban
- `banExpires`: Ban expiration date

## Usage

1. Navigate to `/dashboard/users`
2. View all users in the data table
3. Use search to find specific users
4. Click the actions menu (three dots) for each user
5. Use "Add User" button to create new users

## Styling

The implementation uses Tailwind CSS with shadcn/ui components for a modern, consistent design that follows the project's design system.

## Error Handling

- All API calls include proper error handling
- User-friendly error messages
- Loading states for better UX
- Confirmation dialogs for destructive actions
