"""Authoritative verbatim text for the Constitution of India.

Includes:
- Preamble
- Part I: The Union and its Territory (Articles 1-4)
- Part II: Citizenship (Articles 5-11)
- Part III: Fundamental Rights (Articles 12-35)
- Part IV: Directive Principles of State Policy (Articles 36-51)
- Part IVA: Fundamental Duties (Article 51A)
- Part V: The Union (Articles 52-151, including President, Parliament, Supreme Court 124-147)
- Part VI: The States (Articles 152-237, including High Courts 214-232, Subordinate Courts 233-237)
- Part VIII: Union Territories (Articles 239-242, Special Provisions for Delhi 239AA)
- Part IX & IXA: Panchayats & Municipalities (Articles 243-243ZG)
- Part XI: Relations Between Union and States (Articles 245-263)
- Part XII: Finance, Property, Contracts, Suits (Articles 264-300A, Right to Property 300A)
- Part XIII: Trade, Commerce and Intercourse (Articles 301-307)
- Part XIV & XIVA: Services & Tribunals (Articles 308-323B)
- Part XV: Elections (Articles 324-329A)
- Part XVI: Special Provisions Relating to Certain Classes (Articles 330-342A)
- Part XVII: Official Language (Articles 343-351)
- Part XVIII: Emergency Provisions (Articles 352-360)
- Part XIX: Miscellaneous (Articles 361-367)
- Part XX: Amendment of the Constitution (Article 368)
- Part XXI & XXII: Temporary, Transitional & Short Title (Articles 369-395)
- Schedules (First to Twelfth Schedule)
"""

from __future__ import annotations

CONSTITUTION_PROVISIONS: list[dict] = [
    # --- PREAMBLE ---
    {
        "section_number": "PREAMBLE",
        "section_title": "Preamble to the Constitution of India",
        "chapter": "PREAMBLE",
        "provision_type": "preamble",
        "text": """WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens:

JUSTICE, social, economic and political;
LIBERTY of thought, expression, belief, faith and worship;
EQUALITY of status and of opportunity;
and to promote among them all
FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation;

IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.""",
        "defined_terms": ["Sovereign", "Socialist", "Secular", "Democratic", "Republic", "Justice", "Liberty", "Equality", "Fraternity"],
    },

    # --- PART I: THE UNION AND ITS TERRITORY ---
    {
        "section_number": "1",
        "section_title": "Name and territory of the Union",
        "chapter": "PART I - THE UNION AND ITS TERRITORY",
        "provision_type": "article",
        "text": """(1) India, that is Bharat, shall be a Union of States.
(2) The States and the territories thereof shall be as specified in the First Schedule.
(3) The territory of India shall comprise-
(a) the territories of the States;
(b) the Union territories specified in the First Schedule; and
(c) such other territories as may be acquired.""",
        "defined_terms": ["Union of States", "territory of India"],
    },
    {
        "section_number": "2",
        "section_title": "Admission or establishment of new States",
        "chapter": "PART I - THE UNION AND ITS TERRITORY",
        "provision_type": "article",
        "text": """Parliament may by law admit into the Union, or establish, new States on such terms and conditions as it thinks fit.""",
    },
    {
        "section_number": "3",
        "section_title": "Formation of new States and alteration of areas, boundaries or names of existing States",
        "chapter": "PART I - THE UNION AND ITS TERRITORY",
        "provision_type": "article",
        "text": """Parliament may by law-
(a) form a new State by separation of territory from any State or by uniting two or more States or parts of States or by uniting any territory to a part of any State;
(b) increase the area of any State;
(c) diminish the area of any State;
(d) alter the boundaries of any State;
(e) alter the name of any State:
Provided that no Bill for the purpose shall be introduced in either House of Parliament except on the recommendation of the President and unless, where the proposal contained in the Bill affects the area, boundaries or name of any of the States, the Bill has been referred by the President to the Legislature of that State for expressing its views thereon within such period as may be specified in the reference or within such further period as the President may allow and the period so specified or allowed has expired.""",
        "has_proviso": True,
    },
    {
        "section_number": "4",
        "section_title": "Laws made under articles 2 and 3 to provide for the amendment of the First and the Fourth Schedules and supplemental, incidental and consequential matters",
        "chapter": "PART I - THE UNION AND ITS TERRITORY",
        "provision_type": "article",
        "text": """(1) Any law referred to in article 2 or article 3 shall contain such provisions for the amendment of the First Schedule and the Fourth Schedule as may be necessary to give effect to the provisions of the law and may also contain such supplemental, incidental and consequential provisions (including provisions as to representation in Parliament and in the Legislature or Legislatures of the State or States affected by such law) as Parliament may deem necessary.
(2) No such law as aforesaid shall be deemed to be an amendment of this Constitution for the purposes of article 368.""",
    },

    # --- PART II: CITIZENSHIP ---
    {
        "section_number": "5",
        "section_title": "Citizenship at the commencement of the Constitution",
        "chapter": "PART II - CITIZENSHIP",
        "provision_type": "article",
        "text": """At the commencement of this Constitution, every person who has his domicile in the territory of India and-
(a) who was born in the territory of India; or
(b) either of whose parents was born in the territory of India; or
(c) who has been ordinarily resident in the territory of India for not less than five years immediately preceding such commencement,
shall be a citizen of India.""",
    },
    {
        "section_number": "11",
        "section_title": "Parliament to regulate the right of citizenship by law",
        "chapter": "PART II - CITIZENSHIP",
        "provision_type": "article",
        "text": """Nothing in the foregoing provisions of this Part shall derogate from the power of Parliament to make any provision with respect to the acquisition and termination of citizenship and all other matters relating to citizenship.""",
    },

    # --- PART III: FUNDAMENTAL RIGHTS ---
    {
        "section_number": "12",
        "section_title": "Definition of State",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (General)",
        "provision_type": "article",
        "text": """In this Part, unless the context otherwise requires, "the State" includes the Government and Parliament of India and the Government and the Legislature of each of the States and all local or other authorities within the territory of India or under the control of the Government of India.""",
        "defined_terms": ["the State"],
    },
    {
        "section_number": "13",
        "section_title": "Laws inconsistent with or in derogation of the fundamental rights",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (General)",
        "provision_type": "article",
        "text": """(1) All laws in force in the territory of India immediately before the commencement of this Constitution, in so far as they are inconsistent with the provisions of this Part, shall, to the extent of such inconsistency, be void.
(2) The State shall not make any law which takes away or abridges the rights conferred by this Part and any law made in contravention of this clause shall, to the extent of the contravention, be void.
(3) In this article, unless the context otherwise requires,-
(a) "law" includes any Ordinance, order, bye-law, rule, regulation, notification, custom or usage having in the territory of India the force of law;
(b) "laws in force" includes laws passed or made by a Legislature or other competent authority in the territory of India before the commencement of this Constitution and not previously repealed, notwithstanding that any such law or any part thereof may not be then in operation either at all or in particular areas.
(4) Nothing in this article shall apply to any amendment of this Constitution made under article 368.""",
        "defined_terms": ["law", "laws in force"],
    },
    {
        "section_number": "14",
        "section_title": "Equality before law",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Equality)",
        "provision_type": "article",
        "text": """The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.""",
        "defined_terms": ["equality before the law", "equal protection of the laws"],
    },
    {
        "section_number": "15",
        "section_title": "Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Equality)",
        "provision_type": "article",
        "text": """(1) The State shall not discriminate against any citizen on grounds only of religion, race, caste, sex, place of birth or any of them.
(2) No citizen shall, on grounds only of religion, race, caste, sex, place of birth or any of them, be subject to any disability, liability, restriction or condition with regard to-
(a) access to shops, public restaurants, hotels and places of public entertainment; or
(b) the use of wells, tanks, bathing ghats, roads and places of public resort maintained wholly or partly out of State funds or dedicated to the use of the general public.
(3) Nothing in this article shall prevent the State from making any special provision for women and children.
(4) Nothing in this article or in clause (2) of article 29 shall prevent the State from making any special provision for the advancement of any socially and educationally backward classes of citizens or for the Scheduled Castes and the Scheduled Tribes.
(5) Nothing in this article or in sub-clause (g) of clause (1) of article 19 shall prevent the State from making any special provision, by law, for the advancement of any socially and educationally backward classes of citizens or for the Scheduled Castes or the Scheduled Tribes in so far as such special provisions relate to their admission to educational institutions including private educational institutions, whether aided or unaided by the State, other than the minority educational institutions referred to in clause (1) of article 30.
(6) Nothing in this article or sub-clause (g) of clause (1) of article 19 or clause (2) of article 29 shall prevent the State from making,-
(a) any special provision for the advancement of any economically weaker sections of citizens other than the classes mentioned in clauses (4) and (5); and
(b) any special provision for the advancement of any economically weaker sections of citizens other than the classes mentioned in clauses (4) and (5) in so far as such special provisions relate to their admission to educational institutions including private educational institutions, whether aided or unaided by the State, other than the minority educational institutions referred to in clause (1) of article 30, which in the case of reservation would be in addition to the existing reservations and subject to a maximum of ten per cent of the total seats in each category.""",
    },
    {
        "section_number": "16",
        "section_title": "Equality of opportunity in matters of public employment",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Equality)",
        "provision_type": "article",
        "text": """(1) There shall be equality of opportunity for all citizens in matters relating to employment or appointment to any office under the State.
(2) No citizen shall, on grounds only of religion, race, caste, sex, descent, place of birth, residence or any of them, be ineligible for, or discriminated against in respect of, any employment or office under the State.
(3) Nothing in this article shall prevent Parliament from making any law prescribing, in regard to a class or classes of employment or appointment to an office under the Government of, or any local or other authority within, a State or Union territory, any requirement as to residence within that State or Union territory prior to such employment or appointment.
(4) Nothing in this article shall prevent the State from making any provision for the reservation of appointments or posts in favour of any backward class of citizens which, in the opinion of the State, is not adequately represented in the services under the State.
(4A) Nothing in this article shall prevent the State from making any provision for reservation in matters of promotion, with consequential seniority, to any class or classes of posts in the services under the State in favour of the Scheduled Castes and the Scheduled Tribes which, in the opinion of the State, are not adequately represented in the services under the State.
(4B) Nothing in this article shall prevent the State from considering any unfilled vacancies of a year which are reserved for being filled up in that year in accordance with any provision for reservation made under clause (4) or clause (4A) as a separate class of vacancies to be filled up in any succeeding year or years and such class of vacancies shall not be considered together with the vacancies of the year in which they are being filled up for determining the ceiling of fifty per cent reservation on total number of vacancies of that year.
(5) Nothing in this article shall affect the operation of any law which provides that the incumbent of an office in connection with the affairs of any religious or denominational institution or any member of the governing body thereof shall be a person professing a particular religion or belonging to a particular denomination.
(6) Nothing in this article shall prevent the State from making any provision for the reservation of appointments or posts in favour of any economically weaker sections of citizens other than the classes mentioned in clause (4), in addition to the existing reservation and subject to a maximum of ten per cent of the posts in each category.""",
    },
    {
        "section_number": "17",
        "section_title": "Abolition of Untouchability",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Equality)",
        "provision_type": "article",
        "text": """"Untouchability" is abolished and its practice in any form is forbidden. The enforcement of any disability arising out of "Untouchability" shall be an offence punishable in accordance with law.""",
    },
    {
        "section_number": "18",
        "section_title": "Abolition of titles",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Equality)",
        "provision_type": "article",
        "text": """(1) No title, not being a military or academic distinction, shall be conferred by the State.
(2) No citizen of India shall accept any title from any foreign State.
(3) No person who is not a citizen of India shall, while he holds any office of profit or trust under the State, accept without the consent of the President any title from any foreign State.
(4) No person holding any office of profit or trust under the State shall, without the consent of the President, accept any present, emolument, or office of any kind from or under any foreign State.""",
    },
    {
        "section_number": "19",
        "section_title": "Protection of certain rights regarding freedom of speech, etc.",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Freedom)",
        "provision_type": "article",
        "text": """(1) All citizens shall have the right-
(a) to freedom of speech and expression;
(b) to assemble peaceably and without arms;
(c) to form associations or unions or co-operative societies;
(d) to move freely throughout the territory of India;
(e) to reside and settle in any part of the territory of India; and
(g) to practise any profession, or to carry on any occupation, trade or business.

(2) Nothing in sub-clause (a) of clause (1) shall affect the operation of any existing law, or prevent the State from making any law, in so far as such law imposes reasonable restrictions on the exercise of the right conferred by the said sub-clause in the interests of the sovereignty and integrity of India, the security of the State, friendly relations with foreign States, public order, decency or morality or in relation to contempt of court, defamation or incitement to an offence.

(3) Nothing in sub-clause (b) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, in the interests of the sovereignty and integrity of India or public order, reasonable restrictions on the exercise of the right conferred by the said sub-clause.

(4) Nothing in sub-clause (c) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, in the interests of the sovereignty and integrity of India or public order or morality, reasonable restrictions on the exercise of the right conferred by the said sub-clause.

(5) Nothing in sub-clauses (d) and (e) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, reasonable restrictions on the exercise of any of the rights conferred by the said sub-clauses either in the interests of the general public or for the protection of the interests of any Scheduled Tribe.

(6) Nothing in sub-clause (g) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, in the interests of the general public, reasonable restrictions on the exercise of the right conferred by the said sub-clause, and, in particular, nothing in the said sub-clause shall affect the operation of any existing law in so far as it relates to, or prevent the State from making any law relating to,-
(i) the professional or technical qualifications necessary for practising any profession or carrying on any occupation, trade or business, or
(ii) the carrying on by the State, or by a corporation owned or controlled by the State, of any trade, business, industry or service, whether to the exclusion, complete or partial, of citizens or otherwise.""",
        "defined_terms": ["freedom of speech and expression", "reasonable restrictions"],
    },
    {
        "section_number": "20",
        "section_title": "Protection in respect of conviction for offences",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Freedom)",
        "provision_type": "article",
        "text": """(1) No person shall be convicted of any offence except for violation of a law in force at the time of the commission of the act charged as an offence, nor be subjected to a penalty greater than that which might have been inflicted under the law in force at the time of the commission of the offence.
(2) No person shall be prosecuted and punished for the same offence more than once.
(3) No person accused of any offence shall be compelled to be a witness against himself.""",
        "defined_terms": ["ex post facto law", "double jeopardy", "self-incrimination"],
    },
    {
        "section_number": "21",
        "section_title": "Protection of life and personal liberty",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Freedom)",
        "provision_type": "article",
        "text": """No person shall be deprived of his life or personal liberty except according to procedure established by law.""",
        "defined_terms": ["life", "personal liberty", "procedure established by law"],
    },
    {
        "section_number": "21A",
        "section_title": "Right to education",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Freedom)",
        "provision_type": "article",
        "text": """The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine.""",
    },
    {
        "section_number": "22",
        "section_title": "Protection against arrest and detention in certain cases",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Freedom)",
        "provision_type": "article",
        "text": """(1) No person who is arrested shall be detained in custody without being informed, as soon as may be, of the grounds for such arrest nor shall he be denied the right to consult, and to be defended by, a legal practitioner of his choice.
(2) Every person who is arrested and detained in custody shall be produced before the nearest magistrate within a period of twenty-four hours of such arrest excluding the time necessary for the journey from the place of arrest to the court of the magistrate and no such person shall be detained in custody beyond the said period without the authority of a magistrate.
(3) Nothing in clauses (1) and (2) shall apply-
(a) to any person who for the time being is an enemy alien; or
(b) to any person who is arrested or detained under any law providing for preventive detention.""",
    },
    {
        "section_number": "23",
        "section_title": "Prohibition of traffic in human beings and forced labour",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right against Exploitation)",
        "provision_type": "article",
        "text": """(1) Traffic in human beings and begar and other similar forms of forced labour are prohibited and any contravention of this provision shall be an offence punishable in accordance with law.
(2) Nothing in this article shall prevent the State from imposing compulsory service for public purposes, and in imposing such service the State shall not make any discrimination on grounds only of religion, race, caste or class or any of them.""",
    },
    {
        "section_number": "24",
        "section_title": "Prohibition of employment of children in factories, etc.",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right against Exploitation)",
        "provision_type": "article",
        "text": """No child below the age of fourteen years shall be employed to work in any factory or mine or engaged in any other hazardous employment.""",
    },
    {
        "section_number": "25",
        "section_title": "Freedom of conscience and free profession, practice and propagation of religion",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Freedom of Religion)",
        "provision_type": "article",
        "text": """(1) Subject to public order, morality and health and to the other provisions of this Part, all persons are equally entitled to freedom of conscience and the right freely to profess, practise and propagate religion.
(2) Nothing in this article shall affect the operation of any existing law or prevent the State from making any law-
(a) regulating or restricting any economic, financial, political or other secular activity which may be associated with religious practice;
(b) providing for social welfare and reform or the throwing open of Hindu religious institutions of a public character to all classes and sections of Hindus.""",
    },
    {
        "section_number": "32",
        "section_title": "Remedies for enforcement of rights conferred by this Part",
        "chapter": "PART III - FUNDAMENTAL RIGHTS (Right to Constitutional Remedies)",
        "provision_type": "article",
        "text": """(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.
(2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part.
(3) Without prejudice to the powers conferred on the Supreme Court by clauses (1) and (2), Parliament may by law empower any other court to exercise within the local limits of its jurisdiction all or any of the powers exercisable by the Supreme Court under clause (2).
(4) The right guaranteed by this article shall not be suspended except as otherwise provided for by this Constitution.""",
        "defined_terms": ["habeas corpus", "mandamus", "prohibition", "quo warranto", "certiorari"],
    },

    # --- PART IV: DIRECTIVE PRINCIPLES OF STATE POLICY ---
    {
        "section_number": "36",
        "section_title": "Definition of State for DPSP",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """In this Part, unless the context otherwise requires, "the State" has the same meaning as in Part III.""",
    },
    {
        "section_number": "37",
        "section_title": "Application of the principles contained in this Part",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """The provisions contained in this Part shall not be enforceable by any court, but the principles therein laid down are nevertheless fundamental in the governance of the country and it shall be the duty of the State to apply these principles in making laws.""",
    },
    {
        "section_number": "38",
        "section_title": "State to secure a social order for the promotion of welfare of the people",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """(1) The State shall strive to promote the welfare of the people by securing and protecting as effectively as it may a social order in which justice, social, economic and political, shall inform all the institutions of the national life.
(2) The State shall, in particular, strive to minimise the inequalities in income, and endeavour to eliminate inequalities in status, facilities and opportunities, not only amongst individuals but also amongst groups of people residing in different areas or engaged in different vocations.""",
    },
    {
        "section_number": "39",
        "section_title": "Certain principles of policy to be followed by the State",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """The State shall, in particular, direct its policy towards securing-
(a) that the citizens, men and women equally, have the right to an adequate means of livelihood;
(b) that the ownership and control of the material resources of the community are so distributed as best to subserve the common good;
(c) that the operation of the economic system does not result in the concentration of wealth and means of production to the common detriment;
(d) that there is equal pay for equal work for both men and women;
(e) that the health and strength of workers, men and women, and the tender age of children are not abused and that citizens are not forced by economic necessity to enter avocations unsuited to their age or strength;
(f) that children are given opportunities and facilities to develop in a healthy manner and in conditions of freedom and dignity and that childhood and youth are protected against exploitation and against moral and material abandonment.""",
    },
    {
        "section_number": "39A",
        "section_title": "Equal justice and free legal aid",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """The State shall secure that the operation of the legal system promotes justice, on a basis of equal opportunity, and shall, in particular, provide free legal aid, by suitable legislation or schemes or in any other way, to ensure that opportunities for securing justice are not denied to any citizen by reason of economic or other disabilities.""",
    },
    {
        "section_number": "44",
        "section_title": "Uniform civil code for the citizens",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """The State shall endeavour to secure for the citizens a uniform civil code throughout the territory of India.""",
    },
    {
        "section_number": "48A",
        "section_title": "Protection and improvement of environment and safeguarding of forests and wild life",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """The State shall endeavour to protect and improve the environment and to safeguard the forests and wild life of the country.""",
    },
    {
        "section_number": "50",
        "section_title": "Separation of judiciary from executive",
        "chapter": "PART IV - DIRECTIVE PRINCIPLES OF STATE POLICY",
        "provision_type": "article",
        "text": """The State shall take steps to separate the judiciary from the executive in the public services of the State.""",
    },

    # --- PART IVA: FUNDAMENTAL DUTIES ---
    {
        "section_number": "51A",
        "section_title": "Fundamental duties",
        "chapter": "PART IVA - FUNDAMENTAL DUTIES",
        "provision_type": "article",
        "text": """It shall be the duty of every citizen of India-
(a) to abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem;
(b) to cherish and follow the noble ideals which inspired our national struggle for freedom;
(c) to uphold and protect the sovereignty, unity and integrity of India;
(d) to defend the country and render national service when called upon to do so;
(e) to promote harmony and the spirit of common brotherhood amongst all the people of India transcending religious, linguistic and regional or sectional diversities; to renounce practices derogatory to the dignity of women;
(f) to value and preserve the rich heritage of our composite culture;
(g) to protect and improve the natural environment including forests, lakes, rivers and wild life, and to have compassion for living creatures;
(h) to develop the scientific temper, humanism and the spirit of inquiry and reform;
(i) to safeguard public property and to abjure violence;
(j) to strive towards excellence in all spheres of individual and collective activity so that the nation constantly rises to higher levels of endeavour and achievement;
(k) who is a parent or guardian to provide opportunities for education to his child or, as the case may be, ward between the age of six and fourteen years.""",
    },

    # --- PART V: THE UNION (Executive, Parliament, Supreme Court) ---
    {
        "section_number": "52",
        "section_title": "The President of India",
        "chapter": "PART V - THE UNION (The Executive)",
        "provision_type": "article",
        "text": """There shall be a President of India.""",
    },
    {
        "section_number": "74",
        "section_title": "Council of Ministers to aid and advise President",
        "chapter": "PART V - THE UNION (The Executive)",
        "provision_type": "article",
        "text": """(1) There shall be a Council of Ministers with the Prime Minister at the head to aid and advise the President who shall, in the exercise of his functions, act in accordance with such advice:
Provided that the President may require the Council of Ministers to reconsider such advice, either generally or otherwise, and the President shall act in accordance with the advice tendered after such reconsideration.
(2) The question whether any, and if so what, advice was tendered by Ministers to the President shall not be inquired into in any court.""",
        "has_proviso": True,
    },
    {
        "section_number": "79",
        "section_title": "Constitution of Parliament",
        "chapter": "PART V - THE UNION (Parliament)",
        "provision_type": "article",
        "text": """There shall be a Parliament for the Union which shall consist of the President and two Houses to be known respectively as the Council of States and the House of the People.""",
    },
    {
        "section_number": "123",
        "section_title": "Power of President to promulgate Ordinances during recess of Parliament",
        "chapter": "PART V - THE UNION (Legislative Powers of the President)",
        "provision_type": "article",
        "text": """(1) If at any time, except when both Houses of Parliament are in session, the President is satisfied that circumstances exist which render it necessary for him to take immediate action, he may promulgate such Ordinances as the circumstances appear to him to require.
(2) An Ordinance promulgated under this article shall have the same force and effect as an Act of Parliament, but every such Ordinance-
(a) shall be laid before both Houses of Parliament and shall cease to operate at the expiration of six weeks from the reassembly of Parliament, or, if before the expiration of that period resolutions disapproving it are passed by both Houses, upon the passing of the second of those resolutions; and
(b) may be withdrawn at any time by the President.""",
    },
    {
        "section_number": "124",
        "section_title": "Establishment and constitution of Supreme Court",
        "chapter": "PART V - THE UNION (The Union Judiciary)",
        "provision_type": "article",
        "text": """(1) There shall be a Supreme Court of India consisting of a Chief Justice of India and, until Parliament by law prescribes a larger number, of not more than thirty-three other Judges.
(2) Every Judge of the Supreme Court shall be appointed by the President by warrant under his hand and seal on the recommendation of the National Judicial Appointments Commission referred to in article 124A and shall hold office until he attains the age of sixty-five years.""",
    },
    {
        "section_number": "129",
        "section_title": "Supreme Court to be a court of record",
        "chapter": "PART V - THE UNION (The Union Judiciary)",
        "provision_type": "article",
        "text": """The Supreme Court shall be a court of record and shall have all the powers of such a court including the power to punish for contempt of itself.""",
    },
    {
        "section_number": "136",
        "section_title": "Special leave to appeal by the Supreme Court",
        "chapter": "PART V - THE UNION (The Union Judiciary)",
        "provision_type": "article",
        "text": """(1) Notwithstanding anything in this Chapter, the Supreme Court may, in its discretion, grant special leave to appeal from any judgment, decree, determination, sentence or order in any cause or matter passed or made by any court or tribunal in the territory of India.
(2) Nothing in clause (1) shall apply to any judgment, determination, sentence or order passed or made by any court or tribunal constituted by or under any law relating to the Armed Forces.""",
        "has_non_obstante": True,
    },
    {
        "section_number": "141",
        "section_title": "Law declared by Supreme Court to be binding on all courts",
        "chapter": "PART V - THE UNION (The Union Judiciary)",
        "provision_type": "article",
        "text": """The law declared by the Supreme Court shall be binding on all courts within the territory of India.""",
    },
    {
        "section_number": "142",
        "section_title": "Enforcement of decrees and orders of Supreme Court and orders as to discovery, etc.",
        "chapter": "PART V - THE UNION (The Union Judiciary)",
        "provision_type": "article",
        "text": """(1) The Supreme Court in the exercise of its jurisdiction may pass such decree or make such order as is necessary for doing complete justice in any cause or matter pending before it, and any decree so passed or order so made shall be enforceable throughout the territory of India in such manner as may be prescribed by or under any law made by Parliament and, until provision in that behalf is so made, in such manner as the President may by order prescribe.
(2) Subject to the provisions of any law made in this behalf by Parliament, the Supreme Court shall, as respects the whole of the territory of India, have all and every power to make any order for the purpose of securing the attendance of any person, the discovery or production of any documents, or the investigation or punishment of any contempt of itself.""",
        "defined_terms": ["complete justice"],
    },

    # --- PART VI: THE STATES & HIGH COURTS ---
    {
        "section_number": "214",
        "section_title": "High Courts for States",
        "chapter": "PART VI - THE STATES (The High Courts in the States)",
        "provision_type": "article",
        "text": """There shall be a High Court for each State.""",
    },
    {
        "section_number": "226",
        "section_title": "Power of High Courts to issue certain writs",
        "chapter": "PART VI - THE STATES (The High Courts in the States)",
        "provision_type": "article",
        "text": """(1) Notwithstanding anything in article 32 every High Court shall have power, throughout the territories in relation to which it exercises jurisdiction, to issue to any person or authority, including in appropriate cases, any Government, within those territories directions, orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, or any of them, for the enforcement of any of the rights conferred by Part III and for any other purpose.
(2) The power conferred by clause (1) to issue directions, orders or writs to any Government, authority or person may also be exercised by any High Court exercising jurisdiction in relation to the territories within which the cause of action, wholly or in part, arises for the exercise of such power, notwithstanding that the seat of such Government or authority or the residence of such person is not within those territories.
(3) Where any party against whom an interim order, whether by way of injunction or stay or in any other manner, is made on, or in any proceedings relating to, a petition under clause (1), without-
(a) furnishing to such party copies of such petition and all documents in support of the plea for such interim order; and
(b) giving such party an opportunity of being heard,
makes an application to the High Court for the vacation of such order and furnishes a copy of such application to the party in whose favour such order has been made or the counsel of such party, the High Court shall dispose of the application within a period of two weeks from the date on which it is received or from the date on which the copy of such application is so furnished, whichever is later, or where the High Court is closed on the last day of that period, before the expiry of the next day afterwards on which the High Court is open; and if the application is not so disposed of, the interim order shall, on the expiry of that period, or, as the case may be, the expiry of the said next day, stand vacated.
(4) The power conferred on a High Court by this article shall not be in derogation of the power conferred on the Supreme Court by clause (2) of article 32.""",
        "has_non_obstante": True,
        "defined_terms": ["habeas corpus", "mandamus", "prohibition", "quo warranto", "certiorari", "for any other purpose"],
    },
    {
        "section_number": "227",
        "section_title": "Power of superintendence over all courts by the High Court",
        "chapter": "PART VI - THE STATES (The High Courts in the States)",
        "provision_type": "article",
        "text": """(1) Every High Court shall have superintendence over all courts and tribunals throughout the territories in relation to which it exercises jurisdiction.
(2) Without prejudice to the generality of the foregoing provision, the High Court may-
(a) call for returns from such courts;
(b) make and issue general rules and prescribe forms for regulating the practice and proceedings of such courts; and
(c) prescribe forms in which books, entries and accounts shall be kept by the officers of any such courts.""",
    },

    # --- PART VIII: UNION TERRITORIES ---
    {
        "section_number": "239AA",
        "section_title": "Special provisions with respect to Delhi",
        "chapter": "PART VIII - THE UNION TERRITORIES",
        "provision_type": "article",
        "text": """(1) As from the date of commencement of the Constitution (Sixty-ninth Amendment) Act, 1991, the Union territory of Delhi shall be called the National Capital Territory of Delhi (hereafter in this Part referred to as the National Capital Territory) and the administrator thereof appointed under article 239 shall be designated as the Lieutenant Governor.
(2) (a) There shall be a Legislative Assembly for the National Capital Territory and the seats in such Assembly shall be filled by members chosen by direct election from territorial constituencies in the National Capital Territory.
(3) (a) Subject to the provisions of this Constitution, the Legislative Assembly shall have power to make laws for the whole or any part of the National Capital Territory with respect to any of the matters enumerated in the State List or in the Concurrent List, except matters with respect to Public Order, Police and Land.""",
    },

    # --- PART XI: RELATIONS BETWEEN UNION AND STATES ---
    {
        "section_number": "245",
        "section_title": "Extent of laws made by Parliament and by the Legislatures of States",
        "chapter": "PART XI - RELATIONS BETWEEN THE UNION AND THE STATES",
        "provision_type": "article",
        "text": """(1) Subject to the provisions of this Constitution, Parliament may make laws for the whole or any part of the territory of India, and the Legislature of a State may make laws for the whole or any part of the State.
(2) No law made by Parliament shall be deemed to be invalid on the ground that it would have extra-territorial operation.""",
    },
    {
        "section_number": "246",
        "section_title": "Subject-matter of laws made by Parliament and by the Legislatures of States",
        "chapter": "PART XI - RELATIONS BETWEEN THE UNION AND THE STATES",
        "provision_type": "article",
        "text": """(1) Notwithstanding anything in clauses (2) and (3), Parliament has exclusive power to make laws with respect to any of the matters enumerated in List I in the Seventh Schedule (in this Constitution referred to as the "Union List").
(2) Notwithstanding anything in clause (3), Parliament, and, subject to clause (1), the Legislature of any State also, have power to make laws with respect to any of the matters enumerated in List III in the Seventh Schedule (in this Constitution referred to as the "Concurrent List").
(3) Subject to clauses (1) and (2), the Legislature of any State has exclusive power to make laws for such State or any part thereof with respect to any of the matters enumerated in List II in the Seventh Schedule (in this Constitution referred to as the "State List").
(4) Parliament has power to make laws with respect to any matter for any part of the territory of India not included in a State notwithstanding that such matter is a matter enumerated in the State List.""",
        "has_non_obstante": True,
        "defined_terms": ["Union List", "State List", "Concurrent List"],
    },

    # --- PART XII: FINANCE, PROPERTY, CONTRACTS, SUITS ---
    {
        "section_number": "300",
        "section_title": "Suits and proceedings against Government",
        "chapter": "PART XII - FINANCE, PROPERTY, CONTRACTS AND SUITS",
        "provision_type": "article",
        "text": """(1) The Government of India may sue or be sued by the name of the Union of India and the Government of a State may sue or be sued by the name of the State and may, subject to any provisions which may be made by Act of Parliament or of the Legislature of such State enacted by virtue of powers conferred by this Constitution, sue or be sued in relation to their respective affairs in the like cases as the Dominion of India and the corresponding Provinces or the corresponding Indian States might have sued or been sued if this Constitution had not been enacted.""",
    },
    {
        "section_number": "300A",
        "section_title": "Persons not to be deprived of property save by authority of law",
        "chapter": "PART XII - FINANCE, PROPERTY, CONTRACTS AND SUITS",
        "provision_type": "article",
        "text": """No person shall be deprived of his property save by authority of law.""",
        "defined_terms": ["property", "authority of law"],
    },

    # --- PART XVIII: EMERGENCY PROVISIONS ---
    {
        "section_number": "352",
        "section_title": "Proclamation of Emergency",
        "chapter": "PART XVIII - EMERGENCY PROVISIONS",
        "provision_type": "article",
        "text": """(1) If the President is satisfied that a grave emergency exists whereby the security of India or of any part of the territory thereof is threatened, whether by war or external aggression or armed rebellion, he may, by Proclamation, make a declaration to that effect in respect of the whole of India or of such part of the territory thereof as may be specified in the Proclamation.
(2) A Proclamation issued under clause (1) may be varied or revoked by a subsequent Proclamation.
(3) The President shall not issue a Proclamation under clause (1) or a Proclamation varying such Proclamation unless the decision of the Union Cabinet (that is to say, the Council consisting of the Prime Minister and other Ministers of Cabinet rank appointed under article 75) that such a Proclamation may be issued has been communicated to him in writing.""",
    },
    {
        "section_number": "356",
        "section_title": "Provisions in case of failure of constitutional machinery in States",
        "chapter": "PART XVIII - EMERGENCY PROVISIONS",
        "provision_type": "article",
        "text": """(1) If the President, on receipt of a report from the Governor of a State or otherwise, is satisfied that a situation has arisen in which the government of the State cannot be carried on in accordance with the provisions of this Constitution, the President may by Proclamation-
(a) assume to himself all or any of the functions of the Government of the State and all or any of the powers vested in or exercisable by the Governor or any body or authority in the State other than the Legislature of the State;
(b) declare that the powers of the Legislature of the State shall be exercisable by or under the authority of Parliament;
(c) make such incidental and consequential provisions as appear to the President to be necessary or desirable for giving effect to the objects of the Proclamation, including provisions for suspending in whole or in part the operation of any provisions of this Constitution relating to any body or authority in the State:
Provided that nothing in this clause shall authorise the President to assume to himself any of the powers vested in or exercisable by a High Court, or to suspend in whole or in part the operation of any provision of this Constitution relating to High Courts.""",
        "has_proviso": True,
    },

    # --- PART XX: AMENDMENT OF THE CONSTITUTION ---
    {
        "section_number": "368",
        "section_title": "Power of Parliament to amend the Constitution and procedure therefor",
        "chapter": "PART XX - AMENDMENT OF THE CONSTITUTION",
        "provision_type": "article",
        "text": """(1) Notwithstanding anything in this Constitution, Parliament may in exercise of its constituent power amend by way of addition, variation or repeal any provision of this Constitution in accordance with the procedure laid down in this article.
(2) An amendment of this Constitution may be initiated only by the introduction of a Bill for the purpose in either House of Parliament, and when the Bill is passed in each House by a majority of the total membership of that House and by a majority of not less than two-thirds of the members of that House present and voting, it shall be presented to the President who shall give his assent to the Bill and thereupon the Constitution shall stand amended in accordance with the terms of the Bill:
Provided that if such amendment seeks to make any change in-
(a) article 54, article 55, article 73, article 162, article 241 or article 279A, or
(b) Chapter IV of Part V, Chapter V of Part VI, or Chapter X of Part XI, or
(c) any of the Lists in the Seventh Schedule, or
(d) the representation of States in Parliament, or
(e) the provisions of this article,
the amendment shall also require to be ratified by the Legislatures of not less than one-half of the States by resolutions to that effect passed by those Legislatures before the Bill making provision for such amendment is presented to the President for assent.
(3) Nothing in article 13 shall apply to any amendment made under this article.""",
        "has_proviso": True,
        "has_non_obstante": True,
        "defined_terms": ["constituent power", "amendment"],
    },

    # --- SCHEDULES ---
    {
        "section_number": "SCH-7",
        "section_title": "Seventh Schedule - Legislative Lists (Union, State, Concurrent)",
        "chapter": "SCHEDULES",
        "provision_type": "schedule",
        "text": """SEVENTH SCHEDULE (Article 246)

LIST I - UNION LIST
1. Defence of India and every part thereof.
2. Naval, military and air forces; any other armed forces of the Union.
14. Entering into treaties and agreements with foreign countries and implementing treaties, agreements and conventions with foreign countries.
41. Trade and commerce with foreign countries; import and export across customs frontiers; definition of customs frontiers.
42. Inter-State trade and commerce.
43. Incorporation, regulation and winding up of trading corporations, including banking, insurance and financial corporations but not including co-operative societies.
82. Taxes on income other than agricultural income.
97. Any other matter not enumerated in List II or List III including any tax not mentioned in either of those Lists (Residuary Powers).

LIST II - STATE LIST
1. Public order (but not including the use of any naval, military or air force).
2. Police (including railway and village police).
3. Officers and servants of the High Court; procedure in rent and revenue courts.
4. Prisons, reformatories, Borstal institutions and other institutions of a like nature.
18. Land, that is to say, rights in or over land, land tenures including the relation of landlord and tenant, and the collection of rents; transfer and alienation of agricultural land; land improvement and agricultural loans; colonization.
54. Taxes on the sale of petroleum crude, high speed diesel, motor spirit (petrol), natural gas, aviation turbine fuel and alcoholic liquor for human consumption.

LIST III - CONCURRENT LIST
1. Criminal law, including all matters included in the Indian Penal Code / Bharatiya Nyaya Sanhita at the commencement of this Constitution.
2. Criminal procedure, including all matters included in the Code of Criminal Procedure / Bharatiya Nagarik Suraksha Sanhita at the commencement of this Constitution.
5. Marriage and divorce; infants and minors; adoption; wills, intestacy and succession; joint family and partition.
6. Transfer of property other than agricultural land; registration of deeds and documents.
7. Contracts, including partnership, agency, contracts of carriage, and other special forms of contracts, but not including contracts relating to agricultural land.
11A. Administration of Justice; constitution and organisation of all courts, except the Supreme Court and the High Courts.
13. Civil procedure, including all matters included in the Code of Civil Procedure at the commencement of this Constitution.""",
    },
]


def seed_constitution_of_india(session) -> int:
    """Seed the canonical Constitution of India instrument and its articles."""
    from kb_cruvels.database.models.instruments import LegalInstrument
    from kb_cruvels.database.models.provisions import ProvisionNode, StatutoryProvision
    from kb_cruvels.domain.identifiers import calculate_sha256, normalize_section_number, normalize_statutory_text
    from kb_cruvels.ingestion.parse_structure import parse_statutory_structure

    # 1. Create or update Constitution of India instrument
    const_id = "inst_constitution_of_india"
    existing_inst = session.query(LegalInstrument).filter(
        (LegalInstrument.id == const_id) |
        (LegalInstrument.title.ilike("Constitution of India"))
    ).first()

    if not existing_inst:
        existing_inst = LegalInstrument(
            id=const_id,
            source_act_id="constitution_of_india",
            title="Constitution of India",
            short_title="Constitution of India",
            year=1950,
            act_number=None,
            instrument_type="constitution",
            jurisdiction="central",
            state_or_ut=None,
            status="in_force",
            in_force=True,
            doc_type="constitution",
            legal_subject="Constitutional Law",
            department="Ministry of Law and Justice / Legislative Department",
            source_url="https://legislative.gov.in/constitution-of-india",
            snapshot_version="v2026.08",
        )
        session.add(existing_inst)
        session.flush()
    else:
        existing_inst.title = "Constitution of India"
        existing_inst.short_title = "Constitution of India"
        existing_inst.year = 1950
        existing_inst.instrument_type = "constitution"
        existing_inst.jurisdiction = "central"
        existing_inst.in_force = True
        session.flush()

    actual_inst_id = existing_inst.id
    count = 0

    for prov_data in CONSTITUTION_PROVISIONS:
        sec_num = prov_data["section_number"]
        sec_norm = normalize_section_number(sec_num)
        raw_text = prov_data["text"]
        canon_text = normalize_statutory_text(raw_text)
        raw_hash = calculate_sha256(raw_text)
        canon_hash = calculate_sha256(canon_text)

        # Check existing provision
        existing_prov = session.query(StatutoryProvision).filter(
            StatutoryProvision.instrument_id == actual_inst_id,
            StatutoryProvision.section_number_norm == sec_norm,
        ).first()

        prov_id = existing_prov.id if existing_prov else f"prov_const_{sec_norm.lower()}"

        if existing_prov:
            existing_prov.section_number = sec_num
            existing_prov.section_title = prov_data.get("section_title")
            existing_prov.chapter = prov_data.get("chapter")
            existing_prov.provision_type = prov_data.get("provision_type", "article")
            existing_prov.source_text = raw_text
            existing_prov.canonical_text = canon_text
            existing_prov.raw_hash = raw_hash
            existing_prov.canonical_hash = canon_hash
            existing_prov.has_proviso = prov_data.get("has_proviso", False)
            existing_prov.has_non_obstante = prov_data.get("has_non_obstante", False)
            existing_prov.defined_terms = prov_data.get("defined_terms", [])
            existing_prov.source_url = "https://legislative.gov.in/constitution-of-india"
            session.flush()
        else:
            new_prov = StatutoryProvision(
                id=prov_id,
                instrument_id=actual_inst_id,
                source_chunk_id=f"const_{sec_norm}",
                section_number=sec_num,
                section_number_norm=sec_norm,
                section_title=prov_data.get("section_title"),
                chapter=prov_data.get("chapter"),
                provision_type=prov_data.get("provision_type", "article"),
                source_text=raw_text,
                canonical_text=canon_text,
                raw_hash=raw_hash,
                canonical_hash=canon_hash,
                status="in_force",
                in_force=True,
                has_proviso=prov_data.get("has_proviso", False),
                has_non_obstante=prov_data.get("has_non_obstante", False),
                acts_referenced=[],
                defined_terms=prov_data.get("defined_terms", []),
                amendment_count=0,
                source_url="https://legislative.gov.in/constitution-of-india",
                snapshot_version="v2026.08",
            )
            session.add(new_prov)
            session.flush()

        # Parse AST structure
        parsed_nodes = parse_statutory_structure(provision_id=prov_id, source_text=raw_text)
        session.query(ProvisionNode).filter(ProvisionNode.provision_id == prov_id).delete()
        
        for idx, node_dom in enumerate(parsed_nodes):
            node = ProvisionNode(
                id=node_dom.node_id or f"{prov_id}_node_{idx}",
                provision_id=prov_id,
                node_type=node_dom.node_type.value,
                ordinal=node_dom.ordinal,
                text=node_dom.text,
                char_start=node_dom.char_start,
                char_end=node_dom.char_end,
                order_index=idx,
            )
            session.add(node)

        count += 1

    session.commit()
    return count
