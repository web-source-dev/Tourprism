// app/action-hub/alert/[id]/page.tsx

import React from 'react'
import Layout from '@/components/Layout'
import Head from 'next/head'
import ActionHubDetail from '@/components/action-hub/ActionHubDetail'

interface ActionHubAlertDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ActionHubAlertDetailPage({
  params,
}: ActionHubAlertDetailPageProps) {
  const { id } = await params

  return (
    <Layout isFooter={false}>
      <Head>
        <title>Alert Details | Action Hub | Tourprism</title>
        <meta name="description" content="View and take action on flagged alerts." />
      </Head>
          <ActionHubDetail alertId={id} />
    </Layout>
  )
}
