"use client"
import React ,{useEffect}from 'react';

const App: React.FC = () => {
  useEffect(() => {
    document.title = "首页";
  }, []);
  return (
    <div>首页</div>
  );
};

export default App;