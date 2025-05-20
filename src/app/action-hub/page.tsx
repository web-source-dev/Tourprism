'use client';

import Layout from '@/components/Layout';
import ActionHubList from '@/components/action-hub/ActionHubList';

const ActionHub = () => {
  return (
    <Layout isFooter={false}>

          <ActionHubList />
    </Layout>
  );
};

export default ActionHub;
