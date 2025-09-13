//creating the routes to open the page with given url

import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import CreateGroup from './pages/CreateGroup'
import { Toaster } from "react-hot-toast"
import { AuthContext } from '../context/AuthContext'

const App = () => {

  const { authUser, loading } = useContext(AuthContext)

  return (
  <div className="bg-[url('./src/assets/bgImage.svg')] bg-cover bg-center min-h-screen w-full">
  <Toaster />
  <Routes>
    <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
    <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
    <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
    <Route path="/create-group" element={!authUser ? <LoginPage /> : <CreateGroup />} />
  </Routes>
</div>


  )
}

export default App