
-- LEADS
INSERT INTO public.leads (full_name, email, phone, program, message, source, status, score, created_at) VALUES
('Marcus Bennett','marcus.bennett@email.com','(312) 555-0142','Class A CDL','Interested in evening classes. Currently a warehouse worker.','website','new',82,now()-interval '2 hours'),
('Destiny Carter','destiny.c@email.com','(773) 555-0199','Class A CDL','Veteran, want to use GI Bill funding.','website','contacted',91,now()-interval '1 day'),
('Hector Ramirez','hector.r@email.com','(708) 555-0123','Class B CDL','Need info on payment plans.','referral','application_started',75,now()-interval '3 days'),
('Aisha Johnson','aisha.j@email.com','(312) 555-0188','Class A CDL','How long is the program?','google','new',68,now()-interval '5 hours'),
('Tyler Novak','tyler.novak@email.com','(815) 555-0177','Third-Party Skills Exam','Already have permit, need road test.','website','enrolled',95,now()-interval '6 days'),
('Brianna Lee','brianna.lee@email.com','(224) 555-0150','Class A CDL','Looking to switch careers from retail.','facebook','contacted',70,now()-interval '2 days'),
('Samuel Okafor','samuel.o@email.com','(630) 555-0166','Class A CDL','Do you offer job placement?','website','new',88,now()-interval '40 minutes'),
('Grace Whitfield','grace.w@email.com','(847) 555-0134','Class B CDL','Interested in bus driving career.','referral','rejected',40,now()-interval '8 days');

-- STUDENTS
INSERT INTO public.students (id, full_name, email, phone, program, cohort, instructor_name, enrollment_date, hours_completed, hours_required, progress_pct, status) VALUES
('11111111-1111-1111-1111-111111111101','Tyler Novak','tyler.novak@email.com','(815) 555-0177','Class A CDL','2026-Spring-A','Dale Foster',CURRENT_DATE-30,148,160,93,'active'),
('11111111-1111-1111-1111-111111111102','Carlos Mendez','carlos.m@email.com','(312) 555-0211','Class A CDL','2026-Spring-A','Dale Foster',CURRENT_DATE-28,120,160,75,'active'),
('11111111-1111-1111-1111-111111111103','Latoya Simmons','latoya.s@email.com','(773) 555-0233','Class A CDL','2026-Spring-A','Rita Alvarez',CURRENT_DATE-25,96,160,60,'active'),
('11111111-1111-1111-1111-111111111104','Jacob Pearson','jacob.p@email.com','(708) 555-0244','Class B CDL','2026-Spring-B','Rita Alvarez',CURRENT_DATE-20,72,120,60,'active'),
('11111111-1111-1111-1111-111111111105','Nina Petrova','nina.p@email.com','(224) 555-0255','Class A CDL','2026-Spring-B','Marcus Webb',CURRENT_DATE-15,48,160,30,'active'),
('11111111-1111-1111-1111-111111111106','Andre Washington','andre.w@email.com','(630) 555-0266','Class A CDL','2026-Winter-C','Marcus Webb',CURRENT_DATE-75,160,160,100,'graduated'),
('11111111-1111-1111-1111-111111111107','Emily Zhang','emily.z@email.com','(847) 555-0277','Class A CDL','2026-Winter-C','Dale Foster',CURRENT_DATE-80,160,160,100,'graduated'),
('11111111-1111-1111-1111-111111111108','Derrick Hall','derrick.h@email.com','(815) 555-0288','Class A CDL','2026-Spring-B','Rita Alvarez',CURRENT_DATE-10,16,160,10,'active');

-- DOCUMENTS
INSERT INTO public.documents (student_id, doc_type, status) VALUES
('11111111-1111-1111-1111-111111111101','CDL Permit','verified'),
('11111111-1111-1111-1111-111111111101','DOT Physical','verified'),
('11111111-1111-1111-1111-111111111101','Government ID','verified'),
('11111111-1111-1111-1111-111111111102','CDL Permit','verified'),
('11111111-1111-1111-1111-111111111102','DOT Physical','received'),
('11111111-1111-1111-1111-111111111102','Government ID','pending'),
('11111111-1111-1111-1111-111111111103','CDL Permit','received'),
('11111111-1111-1111-1111-111111111103','DOT Physical','pending'),
('11111111-1111-1111-1111-111111111105','CDL Permit','pending'),
('11111111-1111-1111-1111-111111111108','CDL Permit','pending'),
('11111111-1111-1111-1111-111111111108','DOT Physical','pending');

-- PAYMENTS
INSERT INTO public.payments (student_id, amount, description, status, due_date, paid_date) VALUES
('11111111-1111-1111-1111-111111111101',6500,'Class A CDL Tuition','paid',CURRENT_DATE-25,CURRENT_DATE-26),
('11111111-1111-1111-1111-111111111102',3250,'Tuition Installment 1 of 2','paid',CURRENT_DATE-20,CURRENT_DATE-21),
('11111111-1111-1111-1111-111111111102',3250,'Tuition Installment 2 of 2','pending',CURRENT_DATE+10,NULL),
('11111111-1111-1111-1111-111111111103',6500,'Class A CDL Tuition','overdue',CURRENT_DATE-5,NULL),
('11111111-1111-1111-1111-111111111104',4800,'Class B CDL Tuition','paid',CURRENT_DATE-18,CURRENT_DATE-18),
('11111111-1111-1111-1111-111111111105',6500,'Class A CDL Tuition','pending',CURRENT_DATE+14,NULL),
('11111111-1111-1111-1111-111111111108',3250,'Tuition Installment 1 of 2','overdue',CURRENT_DATE-3,NULL);

-- VEHICLES
INSERT INTO public.vehicles (unit_number, vehicle_type, driver_name, status, lat, lng, speed, location_name) VALUES
('TRK-101','Day Cab Tractor','Tyler Novak','active',41.8781,-87.6298,42,'Chicago Range, IL'),
('TRK-102','Day Cab Tractor','Carlos Mendez','active',41.7606,-88.3201,35,'Aurora Loop, IL'),
('TRK-103','53ft Trailer Combo','Latoya Simmons','active',42.0451,-87.6877,28,'Evanston Route, IL'),
('TRK-104','Day Cab Tractor','Jacob Pearson','idle',41.5250,-88.0817,0,'Joliet Yard, IL'),
('TRK-105','Box Truck (Class B)','Nina Petrova','active',41.8500,-87.6500,18,'Backing Pad, IL'),
('TRK-106','Day Cab Tractor',NULL,'maintenance',41.8369,-87.6847,0,'Maintenance Bay'),
('TRK-107','53ft Trailer Combo','Derrick Hall','active',41.6005,-87.5500,55,'I-80 Skills Run, IN');

-- CARRIERS
INSERT INTO public.carriers (name, openings, locations, avg_salary, hiring) VALUES
('Schneider National',45,'Midwest, Nationwide',62000,true),
('Werner Enterprises',38,'IL, IN, WI',58000,true),
('J.B. Hunt Transport',52,'Nationwide',65000,true),
('US Xpress',21,'Regional Midwest',55000,true),
('Old Dominion Freight',12,'Chicago Metro',68000,true),
('Roehl Transport',9,'Upper Midwest',60000,false);

-- PLACEMENTS
INSERT INTO public.placements (student_id, student_name, carrier_name, status, salary, placed_date) VALUES
('11111111-1111-1111-1111-111111111106','Andre Washington','J.B. Hunt Transport','hired',65000,CURRENT_DATE-5),
('11111111-1111-1111-1111-111111111107','Emily Zhang','Schneider National','offered',62000,NULL),
('11111111-1111-1111-1111-111111111101','Tyler Novak','Werner Enterprises','interviewing',58000,NULL),
('11111111-1111-1111-1111-111111111102','Carlos Mendez','Old Dominion Freight','interviewing',68000,NULL);
