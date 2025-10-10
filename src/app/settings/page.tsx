'use client'

import { useState } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import { PageErrorBoundary } from '@/components/error-boundary'
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Trash2,
  Save,
  Camera,
} from "lucide-react"
import { useAuth } from '@/lib/context'
import { getInitials } from '@/lib/utils'

function SettingsContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // Form states
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [taskUpdates, setTaskUpdates] = useState(true)
  const [projectUpdates, setProjectUpdates] = useState(true)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ]

  const handleSaveProfile = () => {
    // In a real app, this would save to the database
    console.log('Saving profile:', { name, email })
    alert('Profile saved successfully!')
  }

  const handleSaveNotifications = () => {
    // In a real app, this would save to the database
    console.log('Saving notifications:', { emailNotifications, pushNotifications, taskUpdates, projectUpdates })
    alert('Notification preferences saved!')
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-medium">
                        {getInitials(user?.name || 'User')}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Profile Picture</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        JPG, PNG or GIF. Max size 2MB
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        Upload new picture
                      </Button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost">Cancel</Button>
                    <Button onClick={handleSaveProfile}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Receive push notifications on your devices</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pushNotifications}
                          onChange={(e) => setPushNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900">Task Updates</h4>
                        <p className="text-sm text-gray-500">Get notified when tasks are updated</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskUpdates}
                          onChange={(e) => setTaskUpdates(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Project Updates</h4>
                        <p className="text-sm text-gray-500">Get notified about project changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectUpdates}
                          onChange={(e) => setProjectUpdates(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost">Cancel</Button>
                    <Button onClick={handleSaveNotifications}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost">Cancel</Button>
                    <Button>
                      <Lock className="w-4 h-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Theme
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['Light', 'Dark', 'System'].map((theme) => (
                        <button
                          key={theme}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            theme === 'Light'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="font-medium">{theme}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost">Cancel</Button>
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Appearance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select className="input">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select className="input">
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Format
                    </label>
                    <select className="input">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost">Cancel</Button>
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Delete Account</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <SettingsContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}
