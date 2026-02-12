import { useEffect, useState } from 'react';

const steps = [
    { label: 'Assigned', icon: '1' },
    { label: 'In Progress', icon: '2' },
    { label: 'Resolved', icon: '3' },
];

const statusIndex = { 'Assigned': 0, 'In Progress': 1, 'Resolved': 2 };

const StatusProgressBar = ({ status }) => {
    const [animate, setAnimate] = useState(false);
    const activeIdx = statusIndex[status] ?? -1;

    // Hide for statuses not in our 3-step flow
    if (activeIdx === -1) return null;

    const percentage = ((activeIdx + 1) / steps.length) * 100;
    const isComplete = status === 'Resolved';

    // Trigger animation on mount / status change
    useEffect(() => {
        setAnimate(false);
        const t = requestAnimationFrame(() => setAnimate(true));
        return () => cancelAnimationFrame(t);
    }, [status]);

    return (
        <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-5">Status Tracking</h4>

            <div className="relative px-2 sm:px-4">
                {/* Track background */}
                <div className="absolute top-[18px] left-[calc(16.66%)] right-[calc(16.66%)] h-[3px] bg-white/10 rounded-full" />

                {/* Animated fill */}
                <div
                    className={`absolute top-[18px] left-[calc(16.66%)] h-[3px] rounded-full transition-all ease-in-out ${isComplete
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                            : 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_8px_rgba(96,165,250,0.3)]'
                        }`}
                    style={{
                        width: animate
                            ? `calc(${(activeIdx / (steps.length - 1)) * 100}% * 0.6667)`
                            : '0%',
                        transitionDuration: '700ms',
                    }}
                />

                {/* Steps */}
                <div className="relative flex items-start justify-between">
                    {steps.map((step, i) => {
                        const isCompleted = i < activeIdx;
                        const isCurrent = i === activeIdx;
                        const isUpcoming = i > activeIdx;

                        return (
                            <div
                                key={step.label}
                                className="flex flex-col items-center group"
                                style={{ width: `${100 / steps.length}%` }}
                            >
                                {/* Circle */}
                                <div
                                    className={`
                    relative w-9 h-9 rounded-full flex items-center justify-center
                    text-xs font-bold border-2 transition-all duration-500 ease-in-out
                    ${isCompleted
                                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-400/50 text-white scale-100 shadow-lg shadow-green-500/20'
                                            : isCurrent
                                                ? 'bg-gradient-to-br from-blue-400 to-cyan-400 border-blue-400/50 text-white scale-110 shadow-lg shadow-blue-500/30'
                                                : 'bg-white/10 border-white/20 text-white/40 scale-100'
                                        }
                    ${isCurrent ? 'animate-[subtlePulse_2s_ease-in-out_infinite]' : ''}
                    group-hover:scale-110 group-hover:brightness-110
                  `}
                                >
                                    {isCompleted ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span>{step.icon}</span>
                                    )}

                                    {/* Glow ring for current step */}
                                    {isCurrent && (
                                        <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`
                    mt-2.5 text-[11px] sm:text-xs font-medium text-center transition-colors duration-500
                    ${isCompleted ? 'text-green-400' : isCurrent ? 'text-blue-400' : 'text-white/30'}
                  `}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status label bar */}
            <div className="mt-5 text-center">
                {isComplete ? (
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/10">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-400">Work Completed Successfully</span>
                    </div>
                ) : (
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70">
                        Current Status: {status}
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatusProgressBar;
