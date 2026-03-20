import React from 'react';
import { Star } from 'lucide-react';

const Testimonials = () => {
    const testimonials = [
        {
            name: 'Sarah Jenkins',
            role: 'Homeowner',
            content: 'I found an amazing architect for my home extension within days. Simple and effective.',
        },
        {
            name: 'David Chen',
            role: 'General Contractor',
            content: 'Planora helps me find steady work without the usual hassle. A great tool for the industry.',
        },
        {
            name: 'Elena Rodriguez',
            role: 'Interior Designer',
            content: 'Connecting with clients has never been easier. I highly recommend it for freelancers.',
        },
    ];

    return (
        <section id="testimonials" className="section-padding bg-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Community Feedback</h2>
                </div>

                <div className="testimonials-grid">
                    {testimonials.map((item, index) => (
                        <div key={index} className="testimonial-card">
                            <div className="stars-row">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="star-icon" />
                                ))}
                            </div>

                            <p className="testimonial-text">"{item.content}"</p>

                            <div className="testimonial-author">
                                <h4 className="author-name">{item.name}</h4>
                                <span className="author-role">{item.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
