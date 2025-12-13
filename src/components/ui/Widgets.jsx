import React from 'react';
import { Link } from 'react-router-dom';

const Widgets = ({
    bgColor = "#E9F0FC",
    label = "Total Organizations",
    count = 0,
    viewLink = "#",
    colClass = "w-full",
    textColor = "#1D4ED8"
}) => {
    return (
        <div
            className={`p-4 rounded-lg ${colClass}`}
            style={{ backgroundColor: bgColor }}
        >
            <h6 className="text-[12px] mb-5"
            style={{ color: textColor }}>{label}</h6>

            <div>
                <h2 className="text-3xl fw6 text-black">{count}</h2>
                <Link
                    to={viewLink}
                    className="text-sm"
                    style={{ color: textColor }}
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default Widgets;
