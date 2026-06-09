import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useFuelStore } from '@/store/useFuelStore';
import './app.scss';

function App(props) {
  const initFromStorage = useFuelStore(s => s.initFromStorage)

  useEffect(() => {
    console.log('[App] Mounted, initializing store from storage...')
    initFromStorage()
  }, [initFromStorage]);

  useDidShow(() => {
    console.log('[App] onShow, re-syncing storage...')
    initFromStorage()
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
