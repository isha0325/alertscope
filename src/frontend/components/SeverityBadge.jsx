import Icon from './Icon.jsx';

export default function SeverityBadge({ severity }) {
  return <span className={`as-badge as-level-${severity.toLowerCase()}`}><Icon name="alert" size={13}/>{severity}</span>;
}
