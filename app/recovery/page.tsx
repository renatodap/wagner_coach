'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MorningCheckIn } from '@/components/MorningCheckIn';
import {
  HeartPulse,
  Moon,
  Activity,
  TrendingUp,
  Brain,
  Battery,
  Dumbbell,
  LineChart,
  History,
  Plus
} from 'lucide-react';

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <div className="container mx-auto p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-iron-white mb-2">RECOVERY HUB</h1>
            <p className="text-iron-gray">Track your health metrics and recovery status</p>
          </div>
          <MorningCheckIn />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab List - Scrollable on mobile */}
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-iron-black border border-iron-gray">
            <TabsTrigger value="today" className="data-[state=active]:bg-iron-orange">
              <HeartPulse className="mr-2 h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="sleep" className="data-[state=active]:bg-iron-orange">
              <Moon className="mr-2 h-4 w-4" />
              Sleep
            </TabsTrigger>
            <TabsTrigger value="hrv" className="data-[state=active]:bg-iron-orange">
              <Activity className="mr-2 h-4 w-4" />
              HRV
            </TabsTrigger>
            <TabsTrigger value="readiness" className="data-[state=active]:bg-iron-orange">
              <TrendingUp className="mr-2 h-4 w-4" />
              Readiness
            </TabsTrigger>
            <TabsTrigger value="stress" className="data-[state=active]:bg-iron-orange">
              <Brain className="mr-2 h-4 w-4" />
              Stress
            </TabsTrigger>
            <TabsTrigger value="body-battery" className="data-[state=active]:bg-iron-orange">
              <Battery className="mr-2 h-4 w-4" />
              Body Battery
            </TabsTrigger>
            <TabsTrigger value="training-load" className="data-[state=active]:bg-iron-orange">
              <Dumbbell className="mr-2 h-4 w-4" />
              Training Load
            </TabsTrigger>
            <TabsTrigger value="correlations" className="data-[state=active]:bg-iron-orange">
              <LineChart className="mr-2 h-4 w-4" />
              Correlations
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-iron-orange">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="today">
            <TodayTab />
          </TabsContent>

          <TabsContent value="sleep">
            <SleepTab />
          </TabsContent>

          <TabsContent value="hrv">
            <HRVTab />
          </TabsContent>

          <TabsContent value="readiness">
            <ReadinessTab />
          </TabsContent>

          <TabsContent value="stress">
            <StressTab />
          </TabsContent>

          <TabsContent value="body-battery">
            <BodyBatteryTab />
          </TabsContent>

          <TabsContent value="training-load">
            <TrainingLoadTab />
          </TabsContent>

          <TabsContent value="correlations">
            <CorrelationsTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS WITH EMPTY STATES
// ============================================================================

function TodayTab() {
  return (
    <div className="space-y-6">
      <Card className="border-iron-gray bg-iron-black">
        <CardHeader>
          <CardTitle className="text-iron-white">Today's Recovery Overview</CardTitle>
          <CardDescription className="text-iron-gray">
            Your complete health snapshot for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={HeartPulse}
            title="No Data for Today"
            description="Connect your Garmin device or manually log your morning metrics to see your recovery overview."
            actionText="Log Morning Metrics"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SleepTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Sleep Analysis</CardTitle>
        <CardDescription className="text-iron-gray">
          Track your sleep duration, quality, and stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Moon}
          title="No Sleep Data"
          description="Connect your Garmin device or manually log your sleep to track your rest and recovery. Sleep is crucial for muscle growth and performance."
          actionText="Log Sleep"
        />
      </CardContent>
    </Card>
  );
}

function HRVTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Heart Rate Variability</CardTitle>
        <CardDescription className="text-iron-gray">
          Monitor your autonomic nervous system and recovery status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Activity}
          title="No HRV Data"
          description="HRV measures your body's readiness to train. Higher HRV typically indicates better recovery. Connect your Garmin device to track this metric."
          actionText="Connect Garmin"
          actionHref="/settings"
        />
      </CardContent>
    </Card>
  );
}

function ReadinessTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Readiness Score</CardTitle>
        <CardDescription className="text-iron-gray">
          Combined metric showing your readiness to train hard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={TrendingUp}
          title="No Readiness Data"
          description="Your readiness score combines sleep, HRV, and other metrics to show if you're ready for intense training or need recovery."
          actionText="Connect Garmin"
          actionHref="/settings"
        />
      </CardContent>
    </Card>
  );
}

function StressTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Stress Levels</CardTitle>
        <CardDescription className="text-iron-gray">
          Monitor your daily stress and find patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Brain}
          title="No Stress Data"
          description="Track your stress levels throughout the day. High stress can impact recovery and performance. Garmin devices measure stress using HRV."
          actionText="Connect Garmin"
          actionHref="/settings"
        />
      </CardContent>
    </Card>
  );
}

function BodyBatteryTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Body Battery</CardTitle>
        <CardDescription className="text-iron-gray">
          Your energy level throughout the day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Battery}
          title="No Body Battery Data"
          description="Body Battery tracks your energy reserves, showing when you have energy to train and when you need rest. Sync your Garmin device to see your levels."
          actionText="Connect Garmin"
          actionHref="/settings"
        />
      </CardContent>
    </Card>
  );
}

function TrainingLoadTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Training Load</CardTitle>
        <CardDescription className="text-iron-gray">
          Acute vs chronic load ratio and training stress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Dumbbell}
          title="No Training Load Data"
          description="Training load helps you balance hard training with recovery. We calculate your acute (7-day) and chronic (28-day) load to prevent overtraining."
          actionText="View Activities"
          actionHref="/activities"
        />
      </CardContent>
    </Card>
  );
}

function CorrelationsTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Correlations & Insights</CardTitle>
        <CardDescription className="text-iron-gray">
          Discover patterns in your health and performance data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={LineChart}
          title="Not Enough Data Yet"
          description="Once you have at least 14 days of recovery data, we'll analyze correlations between sleep, stress, training, and performance to provide personalized insights."
          actionText="Connect Garmin"
          actionHref="/settings"
        />
      </CardContent>
    </Card>
  );
}

function HistoryTab() {
  return (
    <Card className="border-iron-gray bg-iron-black">
      <CardHeader>
        <CardTitle className="text-iron-white">Recovery History</CardTitle>
        <CardDescription className="text-iron-gray">
          View your complete recovery metrics over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={History}
          title="No Historical Data"
          description="Your recovery history will show trends in sleep, HRV, stress, and readiness over weeks and months."
          actionText="Connect Garmin"
          actionHref="/settings"
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}

function EmptyState({ icon: Icon, title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 p-4 bg-iron-gray/10 rounded-full">
        <Icon className="h-12 w-12 text-iron-orange" />
      </div>
      <h3 className="text-xl font-heading text-iron-white mb-3">{title}</h3>
      <p className="text-iron-gray max-w-md mb-6">{description}</p>
      {actionText && actionHref && (
        <Button asChild className="bg-iron-orange hover:bg-orange-600">
          <a href={actionHref}>{actionText}</a>
        </Button>
      )}
      {actionText && !actionHref && (
        <Button className="bg-iron-orange hover:bg-orange-600">{actionText}</Button>
      )}
    </div>
  );
}
