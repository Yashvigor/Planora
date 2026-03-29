import React from 'react';
import { 
    LayoutGrid, PenTool, Construction, Check, 
    ClipboardList 
} from 'lucide-react';

export const ProjectLifecycle = ({ project, onUpdatePhase }) => {
    const phases = [
        { id: 'planning', label: 'Planning', weight: 30, icon: LayoutGrid, completed: project.planning_completed },
        { id: 'design', label: 'Design', weight: 30, icon: PenTool, completed: project.design_completed, dependsOn: 'planning_completed' },
        { id: 'execution', label: 'Execution', weight: 40, icon: Construction, completed: project.execution_completed, dependsOn: 'design_completed' }
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {phases.map(phase => {
                const isLocked = phase.dependsOn && !project[phase.dependsOn];
                const Icon = phase.icon;
                return (
                    <div key={phase.id} className={`p-2.5 rounded-[1.2rem] border transition-all duration-300 flex flex-col items-center text-center space-y-1 ${
                        phase.completed ? 'bg-emerald-50/50 border-emerald-100' : isLocked ? 'bg-[#F9F7F2]/50 border-transparent opacity-50 grayscale cursor-not-allowed' : 'bg-white border-[#C06842]/10 hover:border-[#C06842]/30'
                    }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 ${
                            phase.completed ? 'bg-emerald-600 text-white' : isLocked ? 'bg-[#E3DACD]/30 text-[#8C7B70]' : 'bg-[#C06842] text-white'
                        }`}>
                            {phase.completed ? <Check size={12} /> : <Icon size={12} />}
                        </div>
                        <div className="space-y-0">
                            <h4 className="font-black text-[#2A1F1D] text-[9px] uppercase tracking-wider">{phase.label}</h4>
                            <p className="text-[7px] font-black uppercase tracking-[0.1em] text-[#C06842] opacity-70">{phase.weight}%</p>
                        </div>
                        {!isLocked && !phase.completed && (
                            <button
                                onClick={() => onUpdatePhase(project.project_id, phase.id, true)}
                                className="text-[7px] font-black uppercase text-[#C06842] hover:text-white hover:bg-[#C06842] px-1.5 py-0.5 rounded-full border border-[#C06842]/20 transition-all font-sans mt-0.5"
                            >
                                Start
                            </button>
                        )}
                        {phase.completed && (
                            <span className="text-[7px] font-black uppercase text-emerald-600 flex items-center gap-1 mt-0.5">
                                Done
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const DailyReportSummary = ({ project }) => {
    const todayDate = new Date().toDateString();
    const todayTasks = project.tasks?.filter(t => {
        const createdToday = new Date(t.created_at).toDateString() === todayDate;
        const submittedToday = t.submitted_at && new Date(t.submitted_at).toDateString() === todayDate;
        const approvedToday = t.approved_at && new Date(t.approved_at).toDateString() === todayDate;
        return createdToday || submittedToday || approvedToday;
    }) || [];
    const approvedTasks = todayTasks.filter(t => 
        (t.status === 'Completed' || t.status === 'Verified' || t.status === 'Approved') &&
        (t.approved_at && new Date(t.approved_at).toDateString() === todayDate)
    );

    return (
        <div className="bg-[#1A1A1A] p-4 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 px-1">
                 <ClipboardList size={11} className="text-[#C06842]" />
                 <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Today's Site Pulse</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
                 <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
                     <p className="text-xl font-serif font-black text-white">{todayTasks.length}</p>
                     <p className="text-[7px] font-black uppercase text-white/40 tracking-widest mt-0.5">Logs</p>
                 </div>
                 <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
                     <p className="text-xl font-serif font-black text-emerald-400">{approvedTasks.length}</p>
                     <p className="text-[7px] font-black uppercase text-white/40 tracking-widest mt-0.5">Approved</p>
                 </div>
             </div>
             {todayTasks.length > 0 ? (
                 <p className="text-[8px] font-medium text-white/50 leading-tight px-1 italic">
                    {Math.round((approvedTasks.length / Math.max(1, todayTasks.length)) * 100)}% efficiency detected today.
                 </p>
             ) : (
                 <p className="text-[8px] font-medium text-white/30 leading-tight px-1 italic">
                    No site logs detected.
                 </p>
             )}
        </div>
    );
};
