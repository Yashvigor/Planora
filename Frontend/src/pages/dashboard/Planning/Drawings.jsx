import React from 'react';
import DocumentManager from '../../components/Common/DocumentManager';

const Drawings = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans text-[#2A1F1D]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-[#2A1F1D]">Project Drawings</h1>
                    <p className="text-[#8C7B70] mt-2 font-medium text-lg">Manage architecture blueprints, structural designs, and MEP drawings.</p>
                </div>
            </div>

            <DocumentManager title="All Drawings" filterType="User Upload" />
        </div>
    );
};

export default Drawings;
