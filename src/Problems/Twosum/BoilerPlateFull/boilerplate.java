
import java.util.Scanner;
import java.util.List;
import java.util.ArrayList; 
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;
import java.util.Stack;
import java.util.LinkedList;
import java.util.HashSet;
import java.util.Set;
import java.util.Iterator;

##Enter Code Here ##

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int size_arr;
                Scanner sc = new Scanner(System.in);
                size_arr = sc.nextInt();
                List<String> arr = new List<String>(size_arr);
                for(int i=0;i<size_arr;i++){
                    arr[i] = sc.nextInt();
                }
int target = sc.nextInt();
        List<Integer> num = twosum(arr,target);
        for(int i=0;i<num.size();i++){
 System.out.print(num[i]+" "); 
 }
    }
}
