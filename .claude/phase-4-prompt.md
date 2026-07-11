# PHASE 4: Mobile App (React Native)

**Duration**: 2 weeks | **Lead**: Frontend Agent | **No questions, full autopilot**

**Prerequisite**: Phase 1-3 complete (web app fully functional)

## Objective

Teacher can access Teacher Paper Maker on iOS and Android. Same features as web: login, create worksheet, edit questions, export PDF. Offline-first: can draft offline, sync when online.

## Acceptance Criteria

- [ ] iOS app (iPhone 12+)
- [ ] Android app (API 24+)
- [ ] Email + Google login
- [ ] Worksheet creation form
- [ ] Question editor
- [ ] PDF preview + export
- [ ] Local SQLite database (offline drafts)
- [ ] Background sync (queue changes when offline)
- [ ] Push notifications (generation complete)
- [ ] Bottom tab navigation (Dashboard, New, Settings)
- [ ] Responsive to safe areas (notch, bottom bar)
- [ ] All TypeScript strict
- [ ] Tests pass (unit + integration)
- [ ] CI/CD builds APK + IPA
- [ ] Network-agnostic (works online + offline)

## What to Build

### 1. Create React Native App

**Structure**:
```
apps/mobile/
├── src/
│   ├── screens/        (Login, Dashboard, Editor, Settings)
│   ├── components/     (Reusable UI)
│   ├── services/       (API client, database, sync)
│   ├── hooks/          (Custom React hooks)
│   ├── types/          (TypeScript)
│   └── App.tsx
├── app.json            (Expo config)
├── eas.json            (EAS Build config)
└── package.json
```

**Tech Stack**:
- React Native (Expo managed)
- Expo Router (navigation)
- TanStack Query (server state)
- zustand (local state)
- SQLite (local data)
- WatermelonDB (optional, for sync)

**Why Expo**: Faster dev cycle, easier CI/CD, no native build complexity for MVP

### 2. API Client Package

**`packages/api-client/`** — Shared TypeScript SDK

```ts
export class TeacherPaperMakerClient {
  private baseUrl: string;
  private token?: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  setToken(token: string) {
    this.token = token;
  }
  
  // Auth
  async register(email: string, name: string, password: string) {
    return this.post('/auth/register', { email, name, password });
  }
  
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }
  
  async googleSignIn(token: string) {
    return this.post('/auth/google', { token });
  }
  
  // Worksheets
  async createWorksheet(spec: WorksheetSpecification) {
    return this.post('/worksheets/generate', spec);
  }
  
  async getWorksheet(id: string) {
    return this.get(`/worksheets/${id}`);
  }
  
  async updateWorksheet(id: string, questions: Question[]) {
    return this.put(`/worksheets/${id}`, { questions });
  }
  
  async exportPDF(id: string, includeAnswerKey: boolean) {
    return this.post(`/worksheets/${id}/export/pdf`, { includeAnswerKey });
  }
  
  // Sync
  async getChanges(since: number): Promise<SyncMessage[]> {
    return this.get('/sync/changes', { since });
  }
  
  async pushChanges(changes: SyncMessage[]) {
    return this.post('/sync/push', { changes });
  }
  
  private async post(path: string, body: any) {
    return fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    }).then(r => r.json());
  }
  
  private headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }
}

export const apiClient = new TeacherPaperMakerClient(
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
);
```

### 3. Local Database (SQLite + WatermelonDB)

**Schema**: Same as web, stored locally

```ts
// apps/mobile/src/database/schema.ts
import { tableSchema, appSchema } from '@nozbe/watermelon';

const worksheetsTable = tableSchema({
  name: 'worksheets',
  columns: [
    { name: 'title', type: 'string' },
    { name: 'curriculum', type: 'string' },
    { name: 'grade', type: 'string' },
    { name: 'subject', type: 'string' },
    { name: 'content_json', type: 'string' }, // JSON blob
    { name: 'status', type: 'string' }, // DRAFT, SYNCED
    { name: 'synced_at', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'server_id', type: 'string', isOptional: true },
  ],
});

export const schema = appSchema({
  version: 1,
  tables: [worksheetsTable],
});
```

### 4. Offline Sync Service

**`apps/mobile/src/services/sync.ts`**:

```ts
export class SyncManager {
  private db: Database;
  private client: TeacherPaperMakerClient;
  private queue: SyncMessage[] = [];
  
  constructor(db: Database, client: TeacherPaperMakerClient) {
    this.db = db;
    this.client = client;
    
    // Listen for network changes
    AppState.addEventListener('change', () => this.syncIfOnline());
  }
  
  async pushLocalChanges() {
    const drafts = await this.db.read(async () => {
      return await this.db.get('worksheets').query(
        Q.where('status', Q.eq('DRAFT'))
      ).fetch();
    });
    
    for (const draft of drafts) {
      this.queue.push({
        action: 'UPDATE_WORKSHEET',
        id: draft.id,
        data: JSON.parse(draft.contentJson),
      });
    }
  }
  
  async syncIfOnline() {
    const isOnline = await NetInfo.fetch().then(state => state.isConnected);
    if (!isOnline) return;
    
    try {
      // Push local changes
      if (this.queue.length > 0) {
        await this.client.pushChanges(this.queue);
        this.queue = [];
      }
      
      // Pull server changes
      const lastSync = await AsyncStorage.getItem('lastSync');
      const changes = await this.client.getChanges(lastSync ? parseInt(lastSync) : 0);
      
      for (const change of changes) {
        await this.applyChange(change);
      }
      
      await AsyncStorage.setItem('lastSync', Date.now().toString());
    } catch (error) {
      console.error('Sync failed:', error);
      // Queue will retry on next sync
    }
  }
  
  private async applyChange(change: SyncMessage) {
    // Update local DB with server data
  }
}
```

### 5. Navigation Setup

**`apps/mobile/src/navigation/Root.tsx`** (Expo Router):

```tsx
import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function RootNavigator() {
  const { isSignedIn, isLoading } = useAuth();
  
  if (isLoading) return <SplashScreen />;
  
  return (
    <Stack>
      {!isSignedIn ? (
        <>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        </>
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
```

**Tabs**:
- `(tabs)/dashboard` — List worksheets
- `(tabs)/new` — Create worksheet
- `(tabs)/settings` — Profile, logout

### 6. Login Screen

**`apps/mobile/src/screens/auth/LoginScreen.tsx`**:

```tsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  
  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View className="flex-1 justify-center px-4">
      <Text className="text-2xl font-bold mb-6">Teacher Paper Maker</Text>
      
      {error && <Text className="text-red-500 mb-4">{error}</Text>}
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        className="border border-gray-300 rounded px-4 py-2 mb-4"
      />
      
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border border-gray-300 rounded px-4 py-2 mb-6"
      />
      
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="bg-blue-600 rounded px-4 py-3 mb-4"
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={loginWithGoogle}>
        <Text className="text-center text-blue-600">Sign in with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/auth/register')}>
        <Text className="text-center text-gray-600 mt-6">
          Don't have an account? <Text className="text-blue-600">Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 7. Dashboard Screen

**`apps/mobile/src/screens/Dashboard.tsx`**:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api-client';

export default function DashboardScreen() {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiClient.getDocuments(),
  });
  
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">My Worksheets</Text>
      
      {documents.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 mb-4">No worksheets yet</Text>
          <TouchableOpacity className="bg-blue-600 px-6 py-2 rounded">
            <Text className="text-white">Create First Worksheet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={({ item }) => (
            <TouchableOpacity className="border border-gray-200 rounded p-4 mb-3">
              <Text className="font-semibold">{item.title}</Text>
              <Text className="text-sm text-gray-600">{item.subject} - {item.grade}</Text>
              <Text className="text-xs text-gray-500 mt-2">{item.createdAt}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
}
```

### 8. Worksheet Form (Multi-Step)

Same fields as web, but responsive to mobile screen size

### 9. PDF Preview on Mobile

Use `react-native-pdf` library to display PDFs

### 10. Authentication Hooks

**`apps/mobile/src/hooks/useAuth.ts`**:

```ts
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiClient } from '../services/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const context = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.login(email, password);
      await AsyncStorage.setItem('token', result.token);
      apiClient.setToken(result.token);
      context?.setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    context?.setUser(null);
  };
  
  return {
    ...context,
    isLoading,
    login,
    logout,
  };
}
```

### 11. Testing

**`tests/mobile/`**:
- Login flow (email + Google)
- Worksheet creation
- Offline draft save
- Sync on online

**E2E**: Detox (React Native E2E)
```ts
describe('Worksheet Creation', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should create worksheet offline', async () => {
    await element(by.text('Login')).tap();
    // ... login
    await element(by.text('New Worksheet')).tap();
    // ... fill form
    await element(by.text('Save')).tap();
    // ... verify saved
  });
});
```

### 12. Build & Deploy

**EAS Build**:
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

**App Store + Play Store**: Prepare listings (descriptions, screenshots, pricing)

### What NOT to Do

- ❌ Do NOT use Native modules yet (Expo managed is sufficient)
- ❌ Do NOT build complex animations
- ❌ Do NOT implement full offline-first until sync works
- ❌ Do NOT build macOS/Windows apps yet (Phase X)
- ❌ Do NOT add biometric auth yet
- ❌ Do NOT implement push notifications without Firebase setup

## Steps to Execute

### 1. Setup React Native Project
```bash
npx create-expo-app@latest apps/mobile
cd apps/mobile
pnpm install
```

### 2. API Client Package
- Create `packages/api-client/`
- Implement TeacherPaperMakerClient
- Export types

### 3. Auth System
- Set up AuthContext + useAuth hook
- Login + Google SignIn screens
- Token storage in AsyncStorage

### 4. Local Database
- Configure WatermelonDB
- Create schema
- Implement queries

### 5. Sync Service
- Implement SyncManager
- Queue offline changes
- Pull server changes on online

### 6. Navigation
- Expo Router setup
- Tab navigation
- Stack navigation for auth

### 7. Screens
- Dashboard (list worksheets)
- New Worksheet form
- Settings (logout, profile)
- Worksheet editor
- PDF preview

### 8. Testing
- Unit tests (API client, sync logic)
- E2E tests (Detox, critical flows)

### 9. Build
- EAS Build config
- Generate APK/IPA
- Test on physical device

## Validation Checklist

- [ ] App builds without errors
- [ ] Login screen appears
- [ ] Email + password login works
- [ ] Google login works
- [ ] Dashboard loads
- [ ] Can create worksheet
- [ ] Form fields validate correctly
- [ ] Worksheet saves locally
- [ ] Offline mode works (disable network, try to create)
- [ ] Sync queues changes
- [ ] Online sync works
- [ ] PDF preview displays
- [ ] Bottom nav tabs work
- [ ] Settings screen shows profile
- [ ] Logout works
- [ ] Tests pass, > 80% coverage
- [ ] APK builds successfully
- [ ] IPA builds successfully

## Exit Criteria (Phase 4 DONE when)

1. ✅ iOS app functional (iPhone 12+)
2. ✅ Android app functional (API 24+)
3. ✅ All features parity with web
4. ✅ Offline-first works (queue + sync)
5. ✅ Tests pass, > 80% coverage
6. ✅ APK + IPA generated
7. ✅ App Store + Play Store ready (not published yet)

---

**CRITICAL**: Follow UNIVERSAL_PROMPT_LAWS.md. Share types with web via packages. No duplicate validation.

**EXECUTE WITHOUT ASKING.**
