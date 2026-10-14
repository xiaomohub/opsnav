type NavItem = {
  id: number;
  name: string;
  url: string;
  description: string;
};

export function NavList({ items }: { items: NavItem[] }) {
  if (items.length === 0) {
    return <p className="muted">暂无导航条目。</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>名称</th>
          <th>链接</th>
          <th>简介</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </a>
            </td>
            <td className="muted">{item.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
