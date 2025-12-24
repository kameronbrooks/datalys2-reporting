import React, { useContext } from "react";
import { ReportModal } from "../lib/types";
import { PageRow } from "./PageRow";
import { AppContext } from "./context/AppContext";


export interface ModalProps {
    modal: ReportModal;
}


export const Modal: React.FC<ModalProps> = ({ 
        modal
    }) => {
    const { closeModal } = useContext(AppContext);
    const { title, description, rows } = modal;

    return (
        <div className="dl2-modal-overlay" onClick={closeModal}>
            <div className="dl2-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="dl2-modal-header">
                    <h2>{title}</h2>
                    <button className="dl2-modal-close-btn" onClick={closeModal}>&times;</button>
                </div>
                
                <div className="dl2-modal-body">
                    {description && (<p className="dl2-modal-description">{description}</p>)}
                    
                    {rows ? rows.map((row, rowIndex) => (
                        <PageRow key={rowIndex} layout={row} />
                    )) 
                    : 
                    <div className="dl2-no-items-div">
                        <p>There are no rows in this modal.</p>
                    </div>}
                </div>
            </div>
        </div>
    );
};
