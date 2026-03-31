# Playlist Persistence & Synchronization Implementation Guide

## Overview

This document outlines the complete implementation of persistent, user-based playlist storage and cross-device synchronization in the Melos Music Player application.

## Architecture

### Data Flow

```
User (Device A)
    ↓
Create/Update Playlist
    ↓
localStorage (Instant UI Update)
    ↓
Supabase Database (via addSongToPlaylistForUser)
    ↓
User logs in on Device B
    ↓
getPlaylistsForUser() fetches from Database
    ↓
UI displays synced playlists
```

## Key Components

### 1. Database Schema (Supabase)

**Table: `playlists`**

```
- id: string (UUID, Primary Key)
- user_id: string (FK → auth.users.id)
- playlist_id: string (App-generated ID)
- name: string
- description: string (nullable)
- image: string (nullable)
- songs: JSON (Array of Song objects)
- created_at: timestamp
- updated_at: timestamp
```

**Indexes:**

- `(user_id, playlist_id)` - For fast lookups per user

### 2. Core API Functions

#### `getPlaylistsForUser(userId: string | undefined): Promise<Playlist[]>`

- **Purpose**: Fetch all playlists for a specific user from the database
- **Fallback**: Returns localStorage playlists if no user or database error
- **Called on**: Login completion, when userId changes
- **Logging**: `[Playlists] Fetching playlists for user: {userId}`

#### `createPlaylistForUser(name: string, userId: string | undefined, description?: string): Promise<Playlist>`

- **Purpose**: Create new playlist and save to both localStorage and database
- **Flow**:
  1. Generate unique playlist ID: `pl_{timestamp}_{randomString}`
  2. Save to localStorage immediately (instant UI update)
  3. If userId exists, also save to database asynchronously
- **Logging**: `[Playlists] Saving new playlist to database: {playlistId}`

#### `addSongToPlaylistForUser(playlistId: string, song: Song, userId: string | undefined): Promise<boolean>`

- **Purpose**: Add song to playlist and sync to database
- **Returns**:
  - `false` if playlist not found or song already exists
  - `true` if successfully added
- **Deduplication**: Checks if song already in playlist before adding
- **Database Sync**: Updates the entire songs array in database
- **Logging**: Detailed logging at each step
  - `[Playlists] Song added to localStorage playlist: {playlistId} {songId}`
  - `[Playlists] Updating playlist in database: {playlistId} with {count} songs`
  - `[Playlists] Song added to playlist in database successfully`

#### `removeSongFromPlaylistForUser(playlistId: string, songId: string, userId: string | undefined): Promise<void>`

- **Purpose**: Remove song from playlist and database
- **Updates**: Both localStorage and database

#### `deletePlaylistForUser(playlistId: string, userId: string | undefined): Promise<void>`

- **Purpose**: Delete entire playlist from both storage layers
- **Cascade**: Removes playlist record but not user auth

#### `migratePlaylistsToDatabase(userId: string): Promise<void>`

- **Purpose**: Migrate playlists created when offline to database on first login
- **Called on**: Login completion
- **Process**:
  1. Get all playlists from localStorage
  2. Check which ones already exist in database
  3. Insert new ones only (avoids duplicates)
- **Safety**: Idempotent - safe to call multiple times

#### `verifyPlaylistInDatabase(playlistId: string, userId: string): Promise<boolean>`

- **Purpose**: Debug function to verify data persistence
- **Returns**: `true` if playlist found in database with correct structure
- **Output**: Logs playlist details for verification

## Implementation Details

### 1. User Identification

- Playlists are linked to `auth.user.id` from Supabase Auth
- This remains consistent across devices for the same authenticated user
- Unauthenticated users get localStorage-only storage

### 2. Two-Layer Storage Strategy

**Layer 1: localStorage**

- Immediate UI updates (no network latency)
- Persists across browser tabs
- Lost on browser cache clear or new device

**Layer 2: Supabase Database**

- Single source of truth for authenticated users
- Syncs across all devices
- Persists indefinitely
- Queried on login to restore data

### 3. Sync Flow for Adding Songs

```typescript
User clicks "Add to Playlist"
    ↓
AddToPlaylistModal opens
    ↓
User selects playlist or creates new one
    ↓
handleAdd() called with playlistId and songs
    ↓
For each song:
  addSongToPlaylistForUser(playlistId, song, userId)
    ↓
    ├─ Update localStorage (sync)
    ├─ Return false if song exists (duplicate check)
    └─ If userId exists:
       └─ Update database row with new songs array (async)
    ↓
verifyPlaylistInDatabase() called after 800ms
    ↓
Toast notification: "Added X songs to playlist"
    ↓
UI state updated via setUserPlaylists()
```

### 4. Login/Logout Flow

```typescript
User logs in
    ↓
useAuth() hook completes authentication
    ↓
Index.tsx detects auth.user?.id change
    ↓
loadUserPlaylists() fetches from database:
  getPlaylistsForUser(auth.user.id)
    ↓
migratePlaylistsToDatabase() runs:
  - Checks localStorage for unmigrated playlists
  - Inserts any new ones (avoids duplicates)
    ↓
setUserPlaylists() updates UI
    ↓
User sees their playlists from all devices
```

```typescript
User logs out
    ↓
useAuth.signOut() clears session
    ↓
Index.tsx detects auth.user = null
    ↓
loadUserPlaylists() runs with null userId
    ↓
getPlaylistsForUser(null) returns localStorage
    ↓
User sees only local playlists again
```

## Component Integration

### Index.tsx

- **Listens for**: `auth.user` changes
- **Actions on Login**:
  1. Call `getPlaylistsForUser(auth.user.id)`
  2. Set `userPlaylists` state
  3. Call `migratePlaylistsToDatabase(auth.user.id)`
  4. Reload playlists to include migrated ones
- **Logs**:
  ```
  [Index] Loaded user playlists: {count}
  [Index] Attempting to migrate playlists to database for user: {userId}
  ```

### PlaylistDetail.tsx

- **Receives**: `userId` prop from Index.tsx
- **On Remove Song**: Calls `removeSongFromPlaylistForUser(playlistId, songId, userId)`
- **On Add Songs**: Shows AddToPlaylistModal with `userId` prop

### AddToPlaylistModal.tsx

- **Receives**: `userId` prop from parent
- **On Add Songs**: Calls `addSongToPlaylistForUser()` for each song
- **Verification**: Runs `verifyPlaylistInDatabase()` after 800ms
- **Feedback**: Shows toast with result count and duplicates info

## Debugging

### Enable Detailed Logging

All playlist operations log to console with `[Playlists]` prefix:

```javascript
// Check what's in localStorage
JSON.parse(localStorage.getItem("playlists") || "[]");

// Check user authentication
getCurrentUser().then((user) => console.log("Logged in as:", user.id));

// Check database from browser console
// Use Supabase Dashboard to inspect the playlists table
```

### Common Issues & Solutions

#### Issue: Playlists not syncing to new device

**Solution Steps**:

1. Open browser console on both devices
2. On original device, create a playlist and look for logs:
   - `[Index] Creating playlist: {name} for user: {userId}`
   - `[Playlists] Saving new playlist to database: {playlistId}`
   - `[Playlists] Playlist verification result: true`
3. On new device, log in and look for:
   - `[Index] Loaded user playlists: {count}`
   - Should include playlists from step 2
4. If not showing, check:
   - Same user logged in on both? (`auth.user.id` must match)
   - Database permissions? Check user_id match in Supabase
   - Network error? Check Supabase status

#### Issue: Songs not persisting in playlist

**Solution Steps**:

1. When adding song, look for:
   - `[AddToPlaylistModal] Adding X song(s) to playlist: {playlistId}`
   - `[Playlists] Song added to localStorage playlist: {playlistId} {songId}`
   - `[Playlists] Updating playlist in database: {playlistId} with X songs`
2. Verify database was updated:
   - Wait ~800ms for verification
   - Look for: `[AddToPlaylistModal] Data persistence verified: true`
3. If verification fails:
   - Check network tab for HTTP errors
   - Check Supabase logs for write errors
   - Verify user_id matches in database row

#### Issue: Migration not working

**Solution Steps**:

1. Look for migration logs:
   - `[Index] Attempting to migrate playlists to database for user: {userId}`
   - `[Playlists] Starting migration from localStorage to database for user: {userId}`
2. Check localStorage has playlists:
   - `JSON.parse(localStorage.getItem("playlists") || "[]").length`
3. After migration, verify:
   - Playlists appear in Supabase Dashboard
   - No duplicates created (safe to run multiple times)

### Testing Cross-Device Sync

1. **Setup**:
   - Device A: Chrome (Incognito Mode)
   - Device B: Firefox on same network
   - Same Supabase project

2. **Test Procedure**:

   ```
   Device A:
   1. Sign up with email1@test.com / password123
   2. Create playlist "Test Playlist 1"
   3. Add 3 songs to it
   4. Check console for verification: true
   5. Leave browser open

   Device B:
   1. Open Firefox
   2. Sign in with email1@test.com / password123
   3. Should see "Test Playlist 1" with 3 songs
   4. Check console for load logs

   Device A:
   1. Add 2 more songs to "Test Playlist 1"
   2. Close and reopen the page

   Device B:
   1. Refresh page
   2. Should see 5 songs in playlist
   ```

3. **Success Criteria**:
   - ✅ No console errors about database
   - ✅ All logs show user_id consistent
   - ✅ Playlists appear across devices
   - ✅ Song counts match between devices
   - ✅ Verification always returns true

## Performance Considerations

### Database Queries

- Playlists fetched once per login (caching recommended)
- Songs stored as JSON array (reasonable up to 10K+ songs per playlist)
- Consider pagination if supporting very large playlists

### Update Strategy

- Currently updates entire songs array per operation
- For future optimization: consider song-level PATCH operations
- Or add separate `playlist_songs` table for better normalization

### Offline Capability

- Fully functional offline with localStorage
- Database sync happens when connection restored
- No merge conflicts (last-write-wins strategy)

## Future Enhancements

1. **Real-time Sync** (WebSocket)

   ```typescript
   supabase
     .channel(`playlist-${playlistId}`)
     .on(
       "postgres_changes",
       { event: "*", schema: "public", table: "playlists" },
       (payload) => {
         // Update UI instantly
       },
     )
     .subscribe();
   ```

2. **Collaborative Playlists**
   - Share playlist with other users
   - Real-time multi-user editing
   - Add `shared_with` field to playlists table

3. **History/Versions**
   - Track all changes with timestamps
   - Undo/Redo capability
   - Audit trail for collaborative playlists

4. **Cloud Backup**
   - Export playlist as JSON/CSV
   - Import from backup files
   - Scheduled daily backups

## Security Notes

1. **User Isolation**: All queries filtered by user_id (RLS recommended)
2. **Data Validation**: Songs must be Song type objects
3. **Error Handling**: Graceful fallback to localStorage on database errors
4. **Session Management**: Auth state properly managed by useAuth hook

## Troubleshooting Checklist

- [ ] User is authenticated? Check `auth.user?.id` is not null
- [ ] Supabase connection working? Check no network errors in console
- [ ] Database table exists? Check `public.playlists` in Supabase Dashboard
- [ ] RLS policies correct? Verify `user_id` matches current user
- [ ] Logs showing [Playlists] prefix? Indicates function executed
- [ ] Verification returning true? Confirms database persistence
- [ ] Same browser? localStorage is browser-specific
- [ ] Cookies/Cache cleared? Might affect session
- [ ] Incognito/Private mode? Can isolate issues to extensions

## References

- [Supabase Docs](https://supabase.com/docs)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
