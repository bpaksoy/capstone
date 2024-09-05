import '../index.css';
import { useState } from 'react';
import College from '../components/College';

const Colleges = () => {
    const [colleges, setColleges] = useState([
        {
            id: 1,
            name: 'Harvard',
            city: 'Cambridge, MA',
            img: 'https://www.harvard.edu/wp-content/uploads/2021/02/091520_Stock_KS_025.jpeg?resize=1200,630',
        },
        {
            id: 2,
            name: 'MIT',
            city: 'Cambridge, MA',
            img: 'https://news.mit.edu/sites/default/files/download/201810/MIT-Computer-Announce-01-PRESS.jpg',
        },
        {
            id: 3,
            name: 'Stanford',
            city: 'Stanford, CA',
            img: 'https://news.stanford.edu/__data/assets/image/0019/90118/Vision_hero-scaled.jpg.jpeg',
        },
        {
            id: 4,
            name: 'Yale',
            city: 'New Haven, CT',
            img: 'https://admissions.yale.edu/sites/default/files/styles/flexslider_full/public/2010_05_10_19_03_37_central_campus_1.jpg?itok=1hVNjje6',
        },
        {
            id: 5,
            name: 'Cornell',
            city: 'Ithaca, NY',
            img: 'https://www.cornell.edu/about/img/main-Tower1.Still001-720x.jpg',
        },
        {
            id: 6,
            name: 'Princeton',
            city: 'Princeton, NJ',
            img: 'https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,h_768,q_50,w_1024/v1/clients/princetonnj/princeton_university_main_building_at_front_gate_geraldine_scull_209cbd93-c4fc-4485-a274-66b4076c71e0.jpg',
        },
    ]);


    const showColleges = true;
    return (
        <div className="bg-primary min-h-screen">
            {showColleges ? (
                <>
                    <div className="flex flex-wrap justify-center">
                        {colleges.map((college) => {
                            return (
                                <College
                                    key={college.id}
                                    id={college.id}
                                    name={college.name}
                                    city={college.city}
                                    img={college.img}
                                />
                            );
                        })}
                    </div>
                </>
            ) : (
                <p>You cannot see the colleges</p>
            )}
        </div>
    );
}

export default Colleges;