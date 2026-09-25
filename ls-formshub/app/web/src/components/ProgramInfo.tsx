import React from 'react';
import Header from './Header';

interface ProgramInfoProps {
    title: string;
    description: string | React.ReactNode;
    dividerColor?: string;
    dividerWidth?: string;
    dividerMarginTop?: number;
    fees?: {
        label: string;
        amount: string;
    }[];
    totalFee?: {
        label: string;
        amount: string;
    };
    showRefundPolicy?: boolean;
}

const ProgramInfo: React.FC<ProgramInfoProps> = ({
    title,
    description,
    dividerColor = "#F26522",
    dividerWidth = "3px",
    dividerMarginTop = 16,
    fees,
    totalFee,
    showRefundPolicy = true
}) => {
    return (
        <>
            <Header title={title} />
            
            <div style={{ marginTop: 24, marginBottom: 24, fontSize: 16, color: '#222', width: '100%' }}>
                {typeof description === 'string' ? <p>{description}</p> : description}
                
                {fees && fees.length > 0 && (
                    <div style={{ margin: '24px 0 16px 0' }}>
                        {fees.map((fee, index) => (
                            <div key={index}>
                                <span>{fee.label}</span>
                                <span style={{ float: 'right' }}>{fee.amount}</span>
                            </div>
                        ))}
                        {totalFee && (
                            <div style={{ fontWeight: 700, marginTop: 8 }}>
                                <span>{totalFee.label}</span>
                                <span style={{ float: 'right' }}>{totalFee.amount}</span>
                            </div>
                        )}
                    </div>
                )}
                
                <div style={{ clear: 'both' }} />
                
                {showRefundPolicy && (
                    <a
                        href="https://www.lawsociety.com.au/purchase-refunds-terms-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#F26522', textDecoration: 'underline', fontSize: 15 }}
                    >
                        Click here to read our Purchase and Refund Policy
                    </a>
                )}
            </div>
            
            <div style={{ height: 2, borderTop: `${dividerWidth} solid ${dividerColor}`, marginTop: dividerMarginTop, width: '100%', marginBottom: 16 }} />
        </>
    );
};

export default ProgramInfo;
