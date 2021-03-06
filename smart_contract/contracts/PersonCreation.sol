// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract PersonCreation is Ownable{
    event NewPerson(string name, uint8 birth_date);
    using SafeMath for uint256;

    struct Person{
        string name;
        string certificate;
        uint8 birth_date;
        uint32 token_balance;
        bool verified;
    }

    struct Student{
        Person person;
        string class;
        bool international;
    }

    struct Staff{
        Person person;
        address s;
        string job;
    }

    struct Visitor{
        Person person;
        address v;
        uint32 visit_day_begin;
        uint32 visit_day_end;
    }
    //students
    Student[] public students;
    mapping(uint => address) public student_id_to_address;
    mapping(address => uint)  student_id_count;//every address(person) should have only 1 account
    //Staf
    Staff[] public staffs;
    mapping(uint => address) public staff_id_to_address;
    mapping(address => uint)  staff_id_count;
    //Visitor
    Visitor[] public visitors;
    mapping(uint => address) public visitor_id_to_address;
    mapping(address => uint)  visitor_id_count;


    //only the university can fill person token balance and certificate ...
    function Creat_Student(string memory _name, uint8 _birth_date,string memory _class, bool _international) external{
        require(student_id_count[msg.sender] == 0);//check that this person have no account
        Student memory s1 = Student(Person(_name,"no_certificate",_birth_date,0,false),_class,_international);
        students.push(s1);
        uint id = students.length - 1;
        student_id_to_address[id] = msg.sender;
        student_id_count[msg.sender] = student_id_count[msg.sender].add(1);
        emit NewPerson(_name,_birth_date);
    }

    ///university will creat staff members
    function Creat_Staff(string memory _name, uint8 _birth_date,string memory _job,address _addOfStaff)onlyOwner external{
        require(staff_id_count[_addOfStaff] == 0);//check that this person have no account
        Staff memory s1 = Staff(Person(_name,"no_certificate",_birth_date,0,true),_addOfStaff,_job);
        staffs.push(s1);
        uint id = staffs.length - 1;
        staff_id_to_address[id] = msg.sender;
        staff_id_count[msg.sender] = staff_id_count[msg.sender].add(1);
        emit NewPerson(_name,_birth_date);
    }

     ///university will creat visitors
    function Creat_Visitor(string memory _name, uint8 _birth_date,uint32 _visit_day_begin,uint32 _visit_day_end,address _addOfVisitor)onlyOwner external{
        require(visitor_id_count[_addOfVisitor] == 0);//check that this person have no account
        Visitor memory s1 = Visitor(Person(_name,"no_certificate",_birth_date,0,true),_addOfVisitor,_visit_day_begin,_visit_day_end);
        visitors.push(s1);
        uint id = visitors.length - 1;
        visitor_id_to_address[id] = msg.sender;
        visitor_id_count[msg.sender] = visitor_id_count[msg.sender].add(1);
        emit NewPerson(_name,_birth_date);
    }
}