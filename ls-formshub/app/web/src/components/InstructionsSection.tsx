import React from 'react';

type Props = {
  items: React.ReactNode[];
};

export default function InstructionsSection({ items }: Props) {
  return (
    <div style={{
      marginTop: '24px',
      marginBottom: '16px'
    }}>
      <ul style={{
        margin: 0,
        paddingLeft: '20px',
        listStyleType: 'disc'
      }}>
        {items.map((item, index) => (
          <li key={index} style={{
            fontSize: '16px',
            lineHeight: '24px',
            color: '#0b1220',
            marginBottom: index === items.length - 1 ? 0 : '8px'
          }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
