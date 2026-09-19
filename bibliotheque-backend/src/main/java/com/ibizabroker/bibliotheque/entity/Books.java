package com.ibizabroker.bibliotheque.entity;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "Books")
public class Books {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer bookId;
    String bookName;
    String bookAuthor;
    String bookGenre;
    Integer noOfCopies;

    public void borrowBook() {
        // Défensif : un livre importé/créé avec copies null ne doit pas lever de NPE
        this.noOfCopies = (this.noOfCopies == null) ? -1 : this.noOfCopies - 1;
    }

    public void returnBook() {
        this.noOfCopies = (this.noOfCopies == null) ? 1 : this.noOfCopies + 1;
    }

}
