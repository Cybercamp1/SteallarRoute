import React from 'react';
import styles from './RouteDetailsModal.module.css';
import { Modal, Button } from '../../components/ui';
import { type RouteOption } from '../../types/route';

interface RouteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteOption | null;
}

export const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  isOpen,
  onClose,
  route,
}) => {
  if (!route) return null;

  // Render mock factors based on route properties
  const isDirect = route.path.length <= 2;
  const gasSavings = isDirect ? '0.012 XLM' : '0.004 XLM';
  const slippage = isDirect ? '< 0.01%' : '0.08%';
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Routing Report">
      <div className={styles.container}>
        {/* Score Header */}
        <div className={styles.scoreHeader}>
          <div className={styles.radialProgress}>
            <span className={styles.scoreNumber}>{route.score}</span>
            <span className={styles.scoreLabel}>/ 100</span>
          </div>
          <div className={styles.recommendationText}>
            <h4>AI Routing Recommendation</h4>
            <p>
              {route.score >= 80
                ? 'This route offers optimal execution with minimal spread and instant finality. Recommended for direct settlement.'
                : 'This route utilizes multi-hop paths to find liquidity. While cheaper, it may experience higher slippage during volatile periods.'}
            </p>
          </div>
        </div>

        {/* Factors Breakdown */}
        <div className={styles.factorsGrid}>
          <div className={styles.factorCard}>
            <span className={styles.factorName}>Exchange Rate (35%)</span>
            <span className={styles.factorValue}>
              {route.score >= 80 ? 'Excellent' : 'Fair'}
            </span>
          </div>
          <div className={styles.factorCard}>
            <span className={styles.factorName}>Total Fees (30%)</span>
            <span className={styles.factorValue}>{route.fee} XLM</span>
          </div>
          <div className={styles.factorCard}>
            <span className={styles.factorName}>Estimated Speed (15%)</span>
            <span className={styles.factorValue}>{route.speed}</span>
          </div>
          <div className={styles.factorCard}>
            <span className={styles.factorName}>Slippage Estimate (10%)</span>
            <span className={styles.factorValue}>{slippage}</span>
          </div>
          <div className={styles.factorCard}>
            <span className={styles.factorName}>Gas Cashback (10%)</span>
            <span className={styles.factorValue}>{gasSavings}</span>
          </div>
        </div>

        {/* Path Visualizer */}
        <div className={styles.pathVisualizer}>
          <h5>Execution Path</h5>
          <div className={styles.hopsFlow}>
            {route.path.map((token, index) => (
              <React.Fragment key={index}>
                <div className={styles.hopNode}>{token}</div>
                {index < route.path.length - 1 && (
                  <div className={styles.hopArrow}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Close button */}
        <div className={styles.actions}>
          <Button onClick={onClose} variant="primary" fullWidth>
            Got it, Select Route
          </Button>
        </div>
      </div>
    </Modal>
  );
};
