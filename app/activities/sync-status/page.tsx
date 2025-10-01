'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Connection {
  name: string
  connected: boolean
  lastSync: Date | null
  activitiesCount: number
  icon: string
}

export default function SyncStatusPage() {
  const [syncing, setSyncing] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([
    {
      name: 'Strava',
      connected: true,
      lastSync: new Date(Date.now() - 3600000), // 1 hour ago
      activitiesCount: 42,
      icon: '🚴'
    },
    {
      name: 'Garmin',
      connected: false,
      lastSync: null,
      activitiesCount: 0,
      icon: '⌚'
    }
  ])

  const handleSync = async (connectionName: string) => {
    setSyncing(connectionName)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update last sync time
    setConnections(connections.map(conn => 
      conn.name === connectionName && conn.connected
        ? { ...conn, lastSync: new Date(), activitiesCount: conn.activitiesCount + Math.floor(Math.random() * 5) }
        : conn
    ))
    
    setSyncing(null)
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never synced'
    
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Activity Sync Status</h1>
      
      <div className="space-y-4">
        {connections.map((conn) => (
          <Card key={conn.name} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{conn.icon}</div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">{conn.name}</h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${conn.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>{conn.connected ? 'Connected' : 'Not connected'}</span>
                    </div>
                    {conn.connected && (
                      <>
                        <div>Last sync: {formatLastSync(conn.lastSync)}</div>
                        <div>Activities synced: {conn.activitiesCount}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {conn.connected ? (
                  <Button
                    onClick={() => handleSync(conn.name)}
                    disabled={syncing === conn.name}
                    size="sm"
                  >
                    {syncing === conn.name ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      '↻ Sync Now'
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Integration not yet available')}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
            
            {syncing === conn.name && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
                <p className="text-sm text-gray-600 mt-2">Fetching activities from {conn.name}...</p>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">About Activity Sync</h3>
        <p className="text-sm text-gray-700">
          Connect your fitness apps to automatically import workouts and activities. 
          Your coach will use this data to provide personalized recommendations.
        </p>
      </div>
    </div>
  )
}
