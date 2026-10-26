import AlertDashboard from './AlertDashboard.jsx';

// Only the production NWS provider is used by the published entry point.
export default function NewComponent(props) {
  return <AlertDashboard {...props} />;
}
