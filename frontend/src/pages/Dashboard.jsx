import React, { useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {

     useEffect(() => {
    api.get('/docker/info')
      .then((res) => console.log('Docker info:', res.data))
      .catch((err) => console.error('API error:', err))
  }, [])

    return (
        <div>
             <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
    );
};

export default Dashboard;