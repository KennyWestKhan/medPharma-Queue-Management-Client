# Medp Queue Management - Mobile App

A modern React Native mobile application built with Expo for real-time patient queue management and online consultations.

## 📱 Features

- **Real-time Queue Tracking**: Live position updates and wait time estimates
- **Role-based Interface**: Separate experiences for patients and doctors
- **WebSocket Integration**: Instant updates for queue changes and status
- **Mobile-first Design**: Optimized for iOS and Android devices
- **Offline Resilience**: Graceful handling of network connectivity issues
- **Cross-platform**: Single codebase for iOS, Android, and web
- **TypeScript**: Full type safety and better developer experience

## 🎯 User Experiences

### For Patients

- **Queue Status Dashboard**: Real-time position and estimated wait time
- **Doctor Selection**: Choose from available healthcare providers
  <!-- - **Status Notifications**: Get notified when it's your turn  -->
  <!-- - **Queue Progress**: Visual progress indicators and remaining patients -->
- **Doctor Information**: View specializations, fees, and availability

### For Doctors

- **Queue Management**: Complete control over patient consultations
  <!-- - **Patient Cards**: Detailed patient information and action controls -->
  <!-- - **Statistics Overview**: Daily metrics and performance insights -->
- **Availability Toggle**: Easy online/offline status management
- **Real-time Updates**: Instant notifications for queue changes

## 🛠️ Prerequisites

- **Node.js** (v16.0.0 or higher)
- **Expo CLI** (`npm install -g @expo/cli`)
- **iOS Simulator** (Mac) or **Android Studio** (Windows/Mac/Linux)
- **Physical device** (optional, for testing)

## 🚀 Installation

### 1. Install Dependencies

```bash
# Navigate to mobile app directory
cd medp-frontend

# Install dependencies
npm install

# Install Expo dependencies
npx expo install
```

### 2. Configuration

#### Update API Endpoint

Edit `src\config\config.ts`:

```typescript
const localIP=
  ? "http://YOUR_COMPUTER_IP:3001" // Replace with your ngrok
  : "https://your-production-api.com";
```

<!-- **Find Your IP Address:** -->

<!-- ```bash -->
<!-- # Windows
ipconfig | findstr "IPv4"

# Mac/Linux
ifconfig | grep inet -->

<!-- # Example: http://192.168.1.105:3001 -->
<!-- ``` -->

#### Expo Configuration

Update `app.json` if needed:

```json
{
  "expo": {
    "name": "MedPharma Queue",
    "slug": "medp-queue",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.medpqueue"
    },
    "android": {
      "package": "com.yourcompany.medpqueue"
    }
  }
}
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start Expo development server
npm start

# Or with specific platform
npm run android  # Android emulator/device
npm run ios      # iOS simulator (Mac only)
npm run web      # Web browser
```

### Using Expo Go App

1. **Install Expo Go** on your mobile device:

   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code** from the terminal or Expo DevTools

3. **Ensure same network**: Device and development computer on same WiFi

### Using Simulators/Emulators

#### iOS Simulator (Mac)

```bash
# Install Xcode from Mac App Store
# Start iOS simulator
npm run ios

# Or manually open simulator
open -a Simulator
```

#### Android Emulator

```bash
# Install Android Studio
# Create and start AVD (Android Virtual Device)
npm run android

# Or start emulator manually
~/Android/Sdk/emulator/emulator -avd YOUR_AVD_NAME
```

## 📱 App Structure

### Screen Navigation Flow

```
RoleSelectionScreen
    ↓
BookingScreen (Patient/Doctor)
    ↓
PatientQueueScreen OR DoctorDashboard
```

### Key Components

#### **Screens**

- `RoleSelectionScreen`: Choose patient or doctor role
- `BookingScreen`: Doctor selection and queue joining
- `PatientQueueScreen`: Real-time queue status for patients
- `DoctorDashboard`: Queue management for doctors

#### **Context Providers**

- `QueueContext`: Global queue state management
- `SocketContext`: WebSocket connection and events

#### **Services**

- Real-time WebSocket communication
- API calls for queue operations
- Local state persistence

## 🔧 Development

### Project Structure

```
src/
├── screens/              # Main app screens
│   ├── RoleSelectionScreen.tsx
│   ├── BookingScreen.tsx
│   ├── PatientQueueScreen.tsx
│   └── DoctorDashboard.tsx
├── components/           # Reusable components
│   ├── common/          # Shared components
│   ├── patient/         # Patient-specific components
│   └── doctor/          # Doctor-specific components
├── context/             # React Context providers
│   ├── QueueContext.tsx
│   └── SocketContext.tsx
├── hooks/               # Custom React hooks
├── services/            # API and external services
├── utils/               # Utility functions
├── types/               # TypeScript definitions
└── styles/              # Styling and themes
```

### Adding New Features

#### 1. Create Component

```typescript
// src/components/common/NewComponent.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface NewComponentProps {
  title: string;
  onPress: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
});

export default NewComponent;
```

#### 2. Add to Screen

```typescript
import NewComponent from "../components/common/NewComponent";

// Inside your screen component
<NewComponent title="Hello World" onPress={() => console.log("Pressed!")} />;
```

### State Management

#### Using Queue Context

```typescript
import { useQueue } from '../context/QueueContext';

const MyComponent = () => {
  const { state, addPatientToQueue, getPatientPosition } = useQueue();

  const handleAddPatient = () => {
    const patientId = addPatientToQueue({
      name: 'John Doe',
      doctorId: 'doc1',
      estimatedDuration: 15,
    });
  };

  return (
    // Your component JSX
  );
};
```

#### Using Socket Context

```typescript
import { useSocket } from '../context/SocketContext';

const MyComponent = () => {
  const { socket, isConnected, joinPatientRoom } = useSocket();

  useEffect(() => {
    if (isConnected) {
      joinPatientRoom(patientId, doctorId);
    }
  }, [isConnected]);

  return (
    // Your component JSX
  );
};
```

## 🎨 Styling & Theming

### Style Guidelines

```typescript
// Use consistent spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20, // Standard padding
    backgroundColor: "#f8fafc",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16, // Rounded corners
    padding: 20,
    marginBottom: 16, // Consistent spacing
    shadowColor: "#000", // Subtle shadows
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // Android shadow
  },
  title: {
    fontSize: 24, // Large titles
    fontWeight: "bold",
    color: "#1e293b", // Dark text
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16, // Regular text
    color: "#64748b", // Muted text
    lineHeight: 22,
  },
});
```

### Color Palette

```typescript
// Define colors for consistency
const colors = {
  primary: "#3b82f6", // Blue
  success: "#10b981", // Green
  warning: "#f59e0b", // Orange
  error: "#ef4444", // Red
  text: {
    primary: "#1e293b", // Dark gray
    secondary: "#64748b", // Medium gray
    muted: "#9ca3af", // Light gray
  },
  background: {
    primary: "#ffffff", // White
    secondary: "#f8fafc", // Light gray
    accent: "#eff6ff", // Light blue
  },
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```typescript
// __tests__/components/PatientCard.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PatientCard from "../src/components/doctor/PatientCard";

describe("PatientCard", () => {
  const mockPatient = {
    id: "123",
    name: "John Doe",
    status: "waiting",
    joinedAt: new Date(),
  };

  it("renders patient information correctly", () => {
    const { getByText } = render(
      <PatientCard patient={mockPatient} onStatusChange={() => {}} />
    );

    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("waiting")).toBeTruthy();
  });

  it("calls onStatusChange when button pressed", () => {
    const mockOnStatusChange = jest.fn();
    const { getByText } = render(
      <PatientCard patient={mockPatient} onStatusChange={mockOnStatusChange} />
    );

    fireEvent.press(getByText("Start Consultation"));
    expect(mockOnStatusChange).toHaveBeenCalledWith("123", "consulting");
  });
});
```

### Manual Testing

1. **Patient Flow Testing**

   - Select patient role
   - Choose doctor and join queue
   - Verify real-time position updates
   - Test status transitions

2. **Doctor Flow Testing**

   - Select doctor role
   - Access dashboard
   - Manage patient queue
   - Test availability toggle

3. **WebSocket Testing**
   - Test connection/disconnection
   - Verify real-time updates
   - Test network interruption recovery

## 📦 Building & Deployment

### Development Build

```bash
# Create development build
eas build --profile development --platform all

# Create development build for specific platform
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production Build

#### 1. Configure EAS Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure
```

#### 2. Build for App Stores

```bash
# Build for both platforms
eas build --platform all

# Build for specific platform
eas build --platform android  # Google Play Store
eas build --platform ios      # Apple App Store
```

#### 3. Submit to Stores

```bash
# Submit to stores
eas submit --platform all

# Submit to specific store
eas submit --platform android  # Google Play
eas submit --platform ios      # Apple App Store
```

### Over-the-Air Updates

```bash
# Create update
eas update --branch production --message "Bug fixes and improvements"

# Create update for specific channel
eas update --channel preview --message "Preview features"
```

## 🔧 Configuration

### Environment Configuration

```typescript
// app.config.js
export default {
  expo: {
    name: "MedPharma Queue",
    slug: "medp-queue",
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3001", //or ngrok link
      socketUrl: process.env.SOCKET_URL || "http://localhost:3001",
    },
  },
};

// Access in app
import Constants from "expo-constants";
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

### Platform-Specific Configuration

```typescript
// Platform-specific code
import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 44 : 20, // iOS status bar
  },
});

// Platform-specific components
const HeaderComponent = Platform.select({
  ios: () => <IOSHeader />,
  android: () => <AndroidHeader />,
  default: () => <DefaultHeader />,
});
```

## 🔍 Debugging

### Debug Tools

```bash
# Enable React Native debugger
# Install React Native Debugger app
# Shake device or Cmd+D (iOS) / Cmd+M (Android)

# Enable remote debugging
# Access: http://localhost:8081/debugger-ui

# Flipper integration (advanced)
# Install Flipper desktop app
# Enable Flipper in your app
```

### Common Issues

**Metro bundler cache issues:**

```bash
# Clear Expo cache
expo start --clear

# Clear npm cache
npm start -- --reset-cache
```

**iOS Simulator issues:**

```bash
# Reset iOS Simulator
Device → Erase All Content and Settings

# Rebuild app
rm -rf node_modules
npm install
npm run ios
```

**Android emulator issues:**

```bash
# Wipe emulator data
# In Android Studio: AVD Manager → Actions → Wipe Data

# Restart ADB
adb kill-server
adb start-server
```

**WebSocket connection issues:**

- Verify backend server is running
- Check IP address in src\config\config.ts
- Ensure firewall allows connections
- Test with device on same network

## 📊 Performance Optimization

### Best Practices

1. **Image Optimization**

   ```typescript
   // Use optimized image component
   import { Image } from "expo-image";

   <Image
     source={{ uri: "https://example.com/image.jpg" }}
     style={{ width: 200, height: 200 }}
     placeholder="Loading..."
     contentFit="cover"
     transition={1000}
   />;
   ```

2. **List Performance**

   ```typescript
   // Use FlatList for large datasets
   <FlatList
     data={patients}
     renderItem={({ item }) => <PatientCard patient={item} />}
     keyExtractor={(item) => item.id}
     removeClippedSubviews={true}
     maxToRenderPerBatch={10}
     updateCellsBatchingPeriod={50}
     windowSize={10}
   />
   ```

3. **State Management**

   ```typescript
   // Use React.memo to prevent unnecessary re-renders
   const PatientCard = React.memo<PatientCardProps>(({ patient }) => {
     return (
       // Component JSX
     );
   });

   // Use useCallback for event handlers
   const handleStatusUpdate = useCallback((patientId: string, status: string) => {
     updatePatientStatus(patientId, status);
   }, [updatePatientStatus]);
   ```

## 📱 Device Testing

### iOS Testing

1. **Physical Device**

   - Enable Developer Mode in Settings
   - Trust computer in device settings
   - Run: `npm run ios --device`

2. **TestFlight (Beta Testing)**
   - Upload build to App Store Connect
   - Add beta testers
   - Send TestFlight invitations

### Android Testing

1. **Physical Device**

   - Enable Developer Options
   - Enable USB Debugging
   - Run: `npm run android --device`

2. **Google Play Console (Beta Testing)**
   - Upload AAB to Play Console
   - Create internal/closed testing track
   - Add beta testers

## 📞 Support & Troubleshooting

### Getting Help

- **Expo Documentation**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **React Native**: https://reactnative.dev/
- **Socket.io Client**: https://socket.io/docs/v4/client-api/

### Common Troubleshooting

**App won't start:**

1. Clear cache: `expo start --clear`
2. Restart Metro: `npx react-native start --reset-cache`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

**Real-time updates not working:**

1. Check backend server is running
2. Verify WebSocket URL in SocketContext
3. Test network connectivity
4. Check console for connection errors

**Build failures:**

1. Check Expo CLI version: `expo --version`
2. Update dependencies: `npx expo install --fix`
3. Check platform compatibility
4. Review error logs in EAS Build

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
