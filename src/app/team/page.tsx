'use client'

import { useState } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthWrapper } from "@/components/auth/auth-wrapper"
import { PageErrorBoundary } from '@/components/error-boundary'
import {
  Users,
  UserPlus,
  Mail,
  Calendar,
  MoreVertical,
  Crown,
  Shield,
  Eye,
  Search,
} from "lucide-react"
import { useAuth } from '@/lib/context'
import { getInitials } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  avatar?: string
  joinedAt: string
  lastActive: string
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'OWNER':
      return <Crown className="w-4 h-4" />
    case 'ADMIN':
      return <Shield className="w-4 h-4" />
    case 'VIEWER':
      return <Eye className="w-4 h-4" />
    default:
      return <Users className="w-4 h-4" />
  }
}

function getRoleBadge(role: string) {
  const styles = {
    OWNER: "bg-purple-100 text-purple-700",
    ADMIN: "bg-blue-100 text-blue-700",
    MEMBER: "bg-gray-100 text-gray-700",
    VIEWER: "bg-green-100 text-green-700",
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[role as keyof typeof styles]}`}>
      {getRoleIcon(role)}
      {role}
    </span>
  )
}

function TeamContent() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // Mock team members - in a real app, this would come from your database
  const teamMembers: TeamMember[] = [
    {
      id: user?._id || '1',
      name: user?.name || 'Current User',
      email: user?.email || 'user@example.com',
      role: 'OWNER',
      joinedAt: '2025-01-01',
      lastActive: 'Just now',
    },
    // Add more mock members if needed
  ]

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-1">
              Manage your team and their access levels
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{teamMembers.length}</p>
                </div>
                <div className="p-2 lg:p-3 rounded-full bg-blue-50">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length}
                  </p>
                </div>
                <div className="p-2 lg:p-3 rounded-full bg-purple-50">
                  <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.lastActive.includes('now') || m.lastActive.includes('ago')).length}
                  </p>
                </div>
                <div className="p-2 lg:p-3 rounded-full bg-green-50">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="p-2 lg:p-3 rounded-full bg-amber-50">
                  <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
                        {getInitials(member.name)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getRoleBadge(member.role)}
                      <div className="hidden sm:block text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {member.lastActive}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No team members found</p>
                  <p className="text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function TeamPage() {
  return (
    <AuthWrapper>
      <PageErrorBoundary>
        <TeamContent />
      </PageErrorBoundary>
    </AuthWrapper>
  )
}
