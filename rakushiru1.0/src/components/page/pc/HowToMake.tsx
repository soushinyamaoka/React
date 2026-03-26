import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const tableWidth: number = 480
const noColWidth: number = 5

const useStyles = makeStyles({
  table: {
    Width: tableWidth,
  },
  container: {
    display: "flex",
    overflowY:'scroll',
  },
});

interface Column {
  id: 'material' | 'amount';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: number) => string;
}
const columns: Column[] = [
  { id: 'material', label: 'No', minWidth: noColWidth },
  { id: 'amount', label: '作り方', minWidth: tableWidth-noColWidth},
];

function createData(no: number, material: string, amount: string) {
  return { no, material, amount };
}

const rows = [
  createData(1, '1', 'ねぎをきる'),
  createData(2, '2', 'じゃがいもをゆでる'),
  createData(3, '3', 'らーめんをゆでる'),
  createData(4, '4', '１２３４５６７８９０１２３４５６７８９０'),
  createData(5, '5', 'ああああ'),
  createData(6, '6', 'ああ'),
  createData(7, '7', ''),
  createData(8, '8', 'あ'),
  createData(5, '9', 'あ'),
  createData(6, '10', 'あ'),
];

const HowToMake = () => {

  return (
    <TableContainer className={useStyles().container} component={Paper}>
      <Table className={useStyles().table} size="small" stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.no}>
              <TableCell>{row.material}</TableCell>
              <TableCell>{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
export default HowToMake;