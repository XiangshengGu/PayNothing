import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './login';
import Home from './home';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../FirebaseConfig';

const Stack = createNativeStackNavigator();

const InsideStack = createNativeStackNavigator();

function InsideLayout() {
  return (
    <InsideStack.Navigator>
      <InsideStack.Screen name="home" component={Home} />
    </InsideStack.Navigator>
  )
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(FIREBASE_AUTH, (user) => {
      console.log('user', user);
      setUser(user);
    });
  }, []);
  return (
      <Stack.Navigator initialRouteName="Login">
        {user ? <Stack.Screen name="Inside" component={InsideLayout} options={{ headerShown: false }} /> :
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        }
      </Stack.Navigator>
  );
}