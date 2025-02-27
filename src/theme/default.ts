import { Theme } from './types';

export const defaultTheme: Theme = {
    node: {
        background: '#ffffff',
        border: '#e2e8f0',
        selectedBorder: '#3b82f6',
        title: '#1e293b',
        type: '#64748b',
        text: '#475569',
        portHover: '#f1f5f9'
    },
    port: {
        exec: '#22c55e',
        data: '#3b82f6',
        border: '#e2e8f0'
    },
    validation: {
        valid: '#22c55e',
        invalid: '#ef4444'
    },
    execution: {
        activePath: '#22c55e',
        inactivePath: '#94a3b8',
        activeOpacity: 1,
        inactiveOpacity: 0.3
    },
    flow: {
        condition: {
            true: '#22c55e',
            false: '#ef4444',
            unknown: '#94a3b8'
        },
        loop: {
            active: '#22c55e',
            inactive: '#94a3b8',
            iteration: '#3b82f6'
        },
        switch: {
            active: '#22c55e',
            inactive: '#94a3b8',
            case: '#3b82f6'
    }
}; 