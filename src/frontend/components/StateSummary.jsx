import AlertCard from './AlertCard.jsx';
import SeverityBadge from './SeverityBadge.jsx';

export default function StateSummary({ groups, ...cardProps }) {
  return <div className="as-state-groups">{groups.map(group => <details className="as-state-group" key={group.event} open={group.alerts.some(alert => alert.id === cardProps.selected) || undefined}>
    <summary><SeverityBadge severity={group.alerts[0].severity}/><strong>{group.event}</strong><span className="as-count">{group.alerts.length}</span></summary>
    <div className="as-group-areas">{[...new Set(group.alerts.map(alert => alert.area))].slice(0, 3).join(' · ')}{group.alerts.length > 3 && ' · More areas below'}</div>
    {group.alerts.map(alert => <AlertCard {...cardProps} key={alert.id} alert={alert} selected={cardProps.selected === alert.id}/>)}</details>)}</div>;
}
